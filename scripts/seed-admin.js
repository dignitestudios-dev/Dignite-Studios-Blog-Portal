/**
 * Seed an admin user into MongoDB.
 * Usage: node scripts/seed-admin.js
 * Requires MONGODB_URI in .env.local
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Manually parse .env.local then .env (no dotenv dependency needed)
[".env.local", ".env"].forEach((file) => {
  const envPath = path.join(__dirname, "../", file);
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8")
      .split("\n")
      .forEach((line) => {
        const [key, ...rest] = line.split("=");
        if (key && rest.length && !process.env[key.trim()])
          process.env[key.trim()] = rest.join("=").trim();
      });
  }
});

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env.local");
  process.exit(1);
}

const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "editor"], default: "admin" },
  },
  { timestamps: true }
);

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

  // ── Change these values before running ──────────────────────────────────
  const email = "admin@dignitestudios.com";
  const password = "Admin@123";
  const name = "Dignite Admin";
  const role = "admin";
  // ────────────────────────────────────────────────────────────────────────

  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    console.log(`ℹ️  Admin user ${email} already exists. Updating password.`);
    existing.passwordHash = passwordHash;
    existing.name = name;
    await existing.save();
  } else {
    await AdminUser.create({ email, passwordHash, name, role });
    console.log(`✅  Admin user created: ${email}`);
  }

  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log("   ⚠️  Change the password after first login (or update it in this script and re-run).");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
