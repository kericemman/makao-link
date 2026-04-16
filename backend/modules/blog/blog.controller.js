const Blog = require("./blog.model");
const NewsletterSubscriber = require("./newsletterSubscriber.model");
const sendEmail = require("../../utils/sendEmail");

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const sendBlogNotificationToSubscribers = async (blog) => {
  const subscribers = await NewsletterSubscriber.find({ isActive: true });

  if (!subscribers.length) return;

  const blogUrl = `${process.env.CLIENT_URL}/blog/${blog.slug}`;

  for (const subscriber of subscribers) {
    try {
      await sendEmail({
        to: subscriber.email,
        subject: `New on Makao Blog: ${blog.title}`,
        html: `
          <h2>${blog.title}</h2>
          <p>${blog.excerpt}</p>
          <p>
            <a href="${blogUrl}" target="_blank" rel="noreferrer">
              Read the full article
            </a>
          </p>
        `
      });
    } catch (error) {
      console.error(`Failed to send blog email to ${subscriber.email}:`, error.message);
    }
  }
};

// public - get all published blogs
exports.getPublishedBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .populate("author", "name")
      .sort({ publishedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      blogs
    });
  } catch (error) {
    next(error);
  }
};

// public - get single published blog by slug
exports.getPublishedBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "published"
    }).populate("author", "name");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    next(error);
  }
};

// public - subscribe to newsletter
exports.subscribeToNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let subscriber = await NewsletterSubscriber.findOne({ email });

    if (subscriber) {
      if (!subscriber.isActive) {
        subscriber.isActive = true;
        subscriber.subscribedAt = new Date();
        await subscriber.save();
      }

      return res.json({
        success: true,
        message: "You are already subscribed."
      });
    }

    subscriber = await NewsletterSubscriber.create({ email });

    await sendEmail({
      to: email,
      subject: "Welcome to Makao Blog Updates",
      html: `
        <h2>Subscription Confirmed</h2>
        <p>Thanks for subscribing to Makao blog updates.</p>
        <p>You’ll receive an email whenever we publish a new article.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully"
    });
  } catch (error) {
    next(error);
  }
};

// admin - get all blogs
exports.getAdminBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      blogs
    });
  } catch (error) {
    next(error);
  }
};

// admin - get single blog
exports.getAdminBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    next(error);
  }
};

// admin - create blog
exports.createBlog = async (req, res, next) => {
  try {
    const { title, excerpt, content, status } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({
        message: "Title, excerpt, and content are required"
      });
    }

    let slug = slugify(title);
    const existingSlug = await Blog.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const coverImage = req.file?.path || "";

    if (req.file) blog.coverImage = req.file.path || "";

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author: req.user._id,
      status: status === "published" ? "published" : "draft",
      publishedAt: status === "published" ? new Date() : null
    });

    if (blog.status === "published") {
      await sendBlogNotificationToSubscribers(blog);
    }

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog
    });
  } catch (error) {
    next(error);
  }
};

// admin - update blog
exports.updateBlog = async (req, res, next) => {
  try {
    const { title, excerpt, content, status } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const wasDraft = blog.status === "draft";

    if (title && title !== blog.title) {
      let newSlug = slugify(title);
      const existingSlug = await Blog.findOne({
        slug: newSlug,
        _id: { $ne: blog._id }
      });

      if (existingSlug) {
        newSlug = `${newSlug}-${Date.now()}`;
      }

      blog.title = title;
      blog.slug = newSlug;
    }

    if (typeof excerpt === "string") blog.excerpt = excerpt;
    if (typeof content === "string") blog.content = content;
    if (req.file) blog.coverImage = req.file.path || req.file.originalname || "";

    if (status && ["draft", "published"].includes(status)) {
      blog.status = status;
    }

    if (blog.status === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    await blog.save();

    if (wasDraft && blog.status === "published") {
      await sendBlogNotificationToSubscribers(blog);
    }

    res.json({
      success: true,
      message: "Blog updated successfully",
      blog
    });
  } catch (error) {
    next(error);
  }
};

// admin - delete blog
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      success: true,
      message: "Blog deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// admin - get newsletter subscribers
exports.getNewsletterSubscribers = async (req, res, next) => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      subscribers
    });
  } catch (error) {
    next(error);
  }
};