import { db } from "~/server/db";
import { createCoolifyDeployment } from "~/server/api/services/coolify";

async function testCreateProvision() {
  console.log("Testing provision creation...");

  try {
    // 1. Find a real user and shop from database
    const user = await db.user.findFirst({
      where: { role: "ADMIN" },
    });

    const shop = await db.shop.findFirst({
      where: {
        websiteProvision: null, // Shop without provision
      },
    });

    if (!user || !shop) {
      console.error("Need at least one user and shop in database");
      return;
    }

    console.log("Found user:", user.email);
    console.log("Found shop:", shop.name);

    // 2. Create provision
    const provision = await db.websiteProvision.create({
      data: {
        userId: user.id,
        shopId: shop.id,
        framework: "WORDPRESS",
        siteType: "ECOMMERCE",
        status: "PENDING",
        
        subdomain: "test-shop-" + Date.now(),
        hasCustomDomain: false,
        
        businessName: shop.name + " (TEST)",
        contactEmail: shop.email,
        
        config: {
          adminUser: "testadmin",
          adminPassword: "TestPass123!",
          adminEmail: shop.email || user.email,
        },
        
        isTest: true,
      },
    });

    console.log("Provision created:", provision.id);

    // 3. Test Coolify deployment
    console.log("Testing Coolify deployment...");
    const coolifyResult = await createCoolifyDeployment(provision);
    console.log("Coolify deployment:", coolifyResult);

    return provision;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}

testCreateProvision()
  .then(() => {
    console.log("All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Tests failed:", error);
    process.exit(1);
  });