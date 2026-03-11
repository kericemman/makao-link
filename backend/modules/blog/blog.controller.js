const Blog = require("./blog.model")
const slugify = require("slugify")
const cloudinary = require("../../config/cloudinary")

// Create blog
exports.createBlog = async (req, res) => {

  try {

    const { title, excerpt, content, status, category, tags } = req.body

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required"
      })
    }

    let coverImage = null

    // Upload to Cloudinary if file exists
    if (req.file) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "makaolink/blogs"
      })

      coverImage = {
        url: result.secure_url,
        public_id: result.public_id
      }

    } 
    else if (req.body.coverImage) {

      coverImage = {
        url: req.body.coverImage
      }

    }

    const blog = await Blog.create({
      title,
      excerpt,
      content,
      status,
      category,
      tags: tags ? JSON.parse(tags) : [],
      slug: slugify(title, { lower: true, strict: true }),
      author: req.user._id,
      coverImage,
      publishedAt: status === "published" ? new Date() : null
    })

    res.status(201).json(blog)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Failed to create blog"
    })

  }

}


// Get all blogs (admin)
exports.getAdminBlogs = async (req, res) => {

  try {

    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .populate("author", "name email");

    res.json(blogs);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch blogs"
    });

  }

};


// Update blog
exports.updateBlog = async (req, res) => {

  try {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found"
      });
    }

    Object.assign(blog, req.body);

    if (req.body.title) {
      blog.slug = slugify(req.body.title, { lower: true, strict: true });
    }

    await blog.save();

    res.json(blog);

  } catch (error) {

    res.status(500).json({
      message: "Failed to update blog"
    });

  }

};


// Delete blog
exports.deleteBlog = async (req, res) => {

  try {

    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found"
      });
    }

    res.json({ message: "Blog deleted" });

  } catch (error) {

    res.status(500).json({
      message: "Failed to delete blog"
    });

  }

};


// Public blogs
exports.getBlogs = async (req, res) => {

  try {

    const blogs = await Blog.find({
      status: "published"
    })
      .sort({ publishedAt: -1 })
      .select("-content");

    res.json(blogs);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch blogs"
    });

  }

};


// Blog details
exports.getBlog = async (req, res) => {

  try {

    const blog = await Blog.findOne({
      slug: req.params.slug
    });

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found"
      });
    }

    res.json(blog);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch blog"
    });

  }

};