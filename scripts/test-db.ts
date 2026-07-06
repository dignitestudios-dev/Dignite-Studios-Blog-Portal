import { connectDB } from "../src/lib/db";
import BlogPost from "../src/models/BlogPost";
import { config } from "dotenv";

config({ path: ".env" });

async function run() {
  await connectDB();
  const trashed = await BlogPost.find({ isTrashed: true }).lean();
  console.log("Trashed posts count:", trashed.length);
  
  // Try finding a post that we know about, or just any post to test update
  const anyPost = await BlogPost.findOne({}).lean();
  if (anyPost) {
    console.log("Found post:", anyPost.title, "isTrashed:", anyPost.isTrashed);
    await BlogPost.findByIdAndUpdate(anyPost._id, { $set: { isTrashed: true, trashedAt: new Date(), status: "draft" } }, { strict: false });
    const updated = await BlogPost.findById(anyPost._id).lean() as any;
    console.log("After update -> isTrashed:", updated.isTrashed, "trashedAt:", updated.trashedAt);
    
    // revert
    await BlogPost.findByIdAndUpdate(anyPost._id, { $set: { isTrashed: false, status: anyPost.status } }, { strict: false });
  } else {
    console.log("No posts found.");
  }
  process.exit(0);
}

run().catch(console.error);
