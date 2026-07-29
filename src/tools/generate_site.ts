import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Tool definition ──

export const generateSiteTool: Tool = {
  name: "generate_site",
  description:
    "Generate a complete, responsive single-page static HTML website for a business. " +
    "Produces a ready-to-publish index.html with embedded CSS — no dependencies or build step. " +
    "Use this after finding a lead with search_businesses to create a site for them.",
  inputSchema: {
    type: "object",
    properties: {
      business_name: {
        type: "string",
        description: "The business name (required). Used in the hero, nav, and footer.",
      },
      address: {
        type: "string",
        description: "Business address — shown in the contact section if provided.",
      },
      phone: {
        type: "string",
        description: "Business phone number — shown in the contact section if provided.",
      },
      description: {
        type: "string",
        description: "A short tagline or description for the hero section.",
      },
      photos: {
        type: "array",
        items: { type: "string" },
        description: "Array of photo URLs to display in the gallery section.",
      },
      output_path: {
        type: "string",
        description:
          "Directory to write the site to. Defaults to ./sitescout-output/<slugified-name>/",
      },
    },
    required: ["business_name"],
  },
};

// ── Tool handler ──

export async function handleGenerateSite(args: {
  business_name: string;
  address?: string;
  phone?: string;
  description?: string;
  photos?: string[];
  output_path?: string;
}): Promise<string> {
  // Validate required fields
  if (!args.business_name || args.business_name.trim().length === 0) {
    return JSON.stringify({
      success: false,
      error:
        "Missing required parameter: 'business_name' must be a non-empty string.",
    });
  }

  const businessName = args.business_name.trim();
  const slug = slugify(businessName);
  const outputDir =
    args.output_path || path.join(".", "sitescout-output", slug);

  // Create output directory (including parents)
  fs.mkdirSync(outputDir, { recursive: true });

  const html = buildHtml({
    businessName,
    address: args.address?.trim() || null,
    phone: args.phone?.trim() || null,
    description: args.description?.trim() || null,
    photos: args.photos?.filter((p) => p.trim().length > 0) ?? [],
  });

  const filePath = path.join(outputDir, "index.html");
  fs.writeFileSync(filePath, html, "utf-8");

  return JSON.stringify({
    success: true,
    path: path.resolve(outputDir),
    file: "index.html",
    url: null,
  });
}

// ── Slugify helper ──

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")         // spaces to hyphens
    .replace(/-+/g, "-")          // collapse multiple hyphens
    .replace(/^-|-$/g, "");       // trim leading/trailing hyphens
}

// ── HTML builder ──

interface SiteData {
  businessName: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  photos: string[];
}

function buildHtml(data: SiteData): string {
  const tagline = data.description || "Your trusted local business";
  const currentYear = new Date().getFullYear();

  // Gallery section (only if photos provided)
  const gallerySection = data.photos.length > 0
    ? buildGallery(data.photos)
    : "";

  // Contact fields
  const addressBlock = data.address
    ? `<p>📍 ${escapeHtml(data.address)}</p>`
    : "";
  const phoneBlock = data.phone
    ? `<p>📞 <a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></p>`
    : "";

  // Services cards
  const services = [
    { icon: "⭐", title: "Quality Service", desc: "We take pride in delivering exceptional quality in everything we do. Our attention to detail sets us apart from the competition." },
    { icon: "🤝", title: "Customer First", desc: "Your satisfaction is our top priority. We work closely with every client to understand their unique needs and exceed expectations." },
    { icon: "🚀", title: "Fast & Reliable", desc: "Count on us for prompt, dependable service every time. We respect your schedule and deliver on our promises." },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(tagline)} — ${escapeHtml(data.businessName)}">
  <title>${escapeHtml(data.businessName)}</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 16px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      background: #fff;
    }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; height: auto; display: block; }

    /* ── Colors ── */
    :root {
      --dark: #1a1a2e;
      --accent: #e94560;
      --accent-hover: #c73a52;
      --light-bg: #f8f9fa;
      --white: #ffffff;
      --text: #333333;
      --text-light: #666666;
      --border: #e0e0e0;
    }

    /* ── Nav ── */
    .nav {
      background: var(--dark);
      color: #fff;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .nav-brand { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
    .nav-links { display: flex; gap: 1.5rem; list-style: none; flex-wrap: wrap; }
    .nav-links a { font-size: 0.9rem; font-weight: 500; opacity: 0.85; transition: opacity 0.2s; }
    .nav-links a:hover { opacity: 1; color: var(--accent); }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(135deg, var(--dark) 0%, #16213e 100%);
      color: #fff;
      text-align: center;
      padding: 5rem 2rem;
    }
    .hero h1 { font-size: 2.8rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.03em; }
    .hero p { font-size: 1.2rem; opacity: 0.85; max-width: 600px; margin: 0 auto 2rem; }
    .btn {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      padding: 0.85rem 2rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1rem;
      transition: background 0.2s, transform 0.15s;
      cursor: pointer;
      border: none;
    }
    .btn:hover { background: var(--accent-hover); transform: translateY(-1px); }

    /* ── Sections ── */
    section { padding: 4rem 2rem; }
    section:nth-of-type(even) { background: var(--light-bg); }
    .section-title {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--dark);
    }
    .section-subtitle {
      text-align: center;
      color: var(--text-light);
      max-width: 500px;
      margin: 0 auto 2.5rem;
    }
    .container { max-width: 1100px; margin: 0 auto; }

    /* ── About ── */
    .about-content {
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
      font-size: 1.05rem;
      color: var(--text-light);
    }

    /* ── Services ── */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .service-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2rem 1.5rem;
      text-align: center;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .service-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .service-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .service-card h3 { font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--dark); }
    .service-card p { color: var(--text-light); font-size: 0.95rem; }

    /* ── Gallery ── */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .gallery-grid img {
      border-radius: 6px;
      width: 100%;
      height: 200px;
      object-fit: cover;
      transition: transform 0.2s;
    }
    .gallery-grid img:hover { transform: scale(1.03); }

    /* ── Contact ── */
    .contact-info {
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      font-size: 1.05rem;
    }
    .contact-info p { margin-bottom: 0.75rem; }

    /* ── Footer ── */
    .footer {
      background: var(--dark);
      color: #fff;
      text-align: center;
      padding: 2rem;
      font-size: 0.9rem;
    }
    .footer .credit { opacity: 0.6; margin-top: 0.5rem; font-size: 0.8rem; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .nav { flex-direction: column; text-align: center; }
      .hero h1 { font-size: 2rem; }
      .hero { padding: 3rem 1.5rem; }
      section { padding: 2.5rem 1.5rem; }
      .section-title { font-size: 1.6rem; }
    }
    @media (max-width: 480px) {
      .hero h1 { font-size: 1.6rem; }
      .btn { padding: 0.7rem 1.5rem; font-size: 0.9rem; }
      .nav-links { gap: 1rem; }
    }
  </style>
</head>
<body>

  <!-- Nav -->
  <nav class="nav">
    <div class="nav-brand">${escapeHtml(data.businessName)}</div>
    <ul class="nav-links">
      <li><a href="#about">About</a></li>
      <li><a href="#services">Services</a></li>
      ${data.photos.length > 0 ? '<li><a href="#gallery">Gallery</a></li>' : ""}
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>

  <!-- Hero -->
  <header class="hero">
    <h1>${escapeHtml(data.businessName)}</h1>
    <p>${escapeHtml(tagline)}</p>
    <a href="#contact" class="btn">Get in Touch</a>
  </header>

  <!-- About -->
  <section id="about">
    <div class="container">
      <h2 class="section-title">About Us</h2>
      <p class="section-subtitle">Learn more about ${escapeHtml(data.businessName)}</p>
      <div class="about-content">
        <p>
          Welcome to <strong>${escapeHtml(data.businessName)}</strong>. We are dedicated to providing
          top-quality products and services to our community. With years of experience and a passion
          for excellence, our team works tirelessly to ensure every customer walks away satisfied.
        </p>
        <p style="margin-top:1rem;">
          Whether you're a first-time visitor or a long-time client, we treat everyone like family.
          Our commitment to integrity, quality, and outstanding customer service is what sets us apart.
        </p>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services">
    <div class="container">
      <h2 class="section-title">Our Services</h2>
      <p class="section-subtitle">What we offer to our valued customers</p>
      <div class="services-grid">
        ${services.map(s => `
        <div class="service-card">
          <div class="service-icon">${s.icon}</div>
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
        </div>`).join("")}
      </div>
    </div>
  </section>

  <!-- Gallery -->
  ${gallerySection}

  <!-- Contact -->
  <section id="contact">
    <div class="container">
      <h2 class="section-title">Get in Touch</h2>
      <p class="section-subtitle">We'd love to hear from you</p>
      <div class="contact-info">
        ${addressBlock}
        ${phoneBlock}
        ${!data.address && !data.phone
          ? '<p>Contact us today to learn more about our services!</p>'
          : ""}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <p>&copy; ${currentYear} ${escapeHtml(data.businessName)}. All rights reserved.</p>
    <p class="credit">Built with SiteScout</p>
  </footer>

</body>
</html>`;
}

// ── Gallery builder ──

function buildGallery(photos: string[]): string {
  const images = photos
    .map((url, i) => `<img src="${escapeAttr(url)}" alt="Gallery photo ${i + 1}" loading="lazy">`)
    .join("\n        ");

  return `
  <!-- Gallery -->
  <section id="gallery">
    <div class="container">
      <h2 class="section-title">Gallery</h2>
      <p class="section-subtitle">Take a look at our work</p>
      <div class="gallery-grid">
        ${images}
      </div>
    </div>
  </section>`;
}

// ── Simple HTML escaping (no external deps) ──

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
