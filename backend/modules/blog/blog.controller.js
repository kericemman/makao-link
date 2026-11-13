const Blog = require("./blog.model");
const NewsletterSubscriber = require("./NewsletterSubscriber.model");
const sendEmail = require("../../utils/sendEmail");
const {
  blogPublishedEmail,
  newsletterWelcomeEmail
} = require("../../utils/emailTemplates");
const { uploadBlogImage } = require("./blogMedia.storage");

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeTags = (tags) => {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim().slice(0, 32)).filter(Boolean))].slice(0, 12);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 32))
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 12);
};

const getArticleValidationMessage = ({ title, excerpt, content, category, status }, requirePublishDetails = status === "published") => {
  if (!String(title || "").trim()) return "Add an article title before saving.";
  if (String(title).trim().length > 180) return "Article title must be 180 characters or fewer.";
  if (requirePublishDetails && status === "published") {
    if (!String(excerpt || "").trim()) return "Add a short summary before publishing.";
    if (!String(content || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim()) return "Add article content before publishing.";
    if (!String(category || "").trim()) return "Choose a category before publishing.";
  }
  return "";
};

const getUploadedFileUrl = (file) => {
  if (!file) return "";

  return (
    file.secure_url ||
    file.url ||
    file.path ||
    file.location ||
    file.filename ||
    ""
  );
};

const normalizeAuthorImage = (value) => {
  const image = String(value || "").trim();
  if (!image) return "";
  try {
    if (new URL(image).protocol !== "https:") throw new Error();
  } catch {
    const error = new Error("Author image must be a valid HTTPS image URL.");
    error.statusCode = 400;
    throw error;
  }
  if (image.length > 2048) {
    const error = new Error("Author image URL is too long.");
    error.statusCode = 400;
    throw error;
  }
  return image;
};

const sendBlogNotificationToSubscribers = async (blog) => {
  const subscribers = await NewsletterSubscriber.find({ isActive: true });

  if (!subscribers.length) return;

  for (const subscriber of subscribers) {
    try {
      await sendEmail({
        to: subscriber.email,
        subject: blog.title,
        html: blogPublishedEmail({
          title: blog.title,
          excerpt: blog.excerpt,
          slug: blog.slug,
          coverImage: blog.coverImage,
          coverImageAlt: blog.coverImageAlt
        })
      });
    } catch (error) {
      console.error(
        `Failed to send blog email to ${subscriber.email}:`,
        error.message
      );
    }
  }
};

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
      subject: "Welcome to RendaHomes Updates",
      html: newsletterWelcomeEmail()
    });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully"
    });
  } catch (error) {
    next(error);
  }
};

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

exports.getAdminBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name email"
    );

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

exports.uploadBlogInlineImage = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Choose an image to upload." });
  try {
    const image = await uploadBlogImage(req.file);
    res.status(201).json({ success: true, image });
  } catch (error) {
    next(error);
  }
};

exports.createBlog = async (req, res, next) => {
  try {
    const {
      title,
      excerpt,
      content,
      status,
      category,
      tags,
      metaTitle,
      metaDescription,
      authorName,
      authorImage
    } = req.body;

    const nextStatus = status === "published" ? "published" : "draft";
    const validationMessage = getArticleValidationMessage({ title, excerpt, content, category, status: nextStatus });
    if (validationMessage) return res.status(400).json({ success: false, message: validationMessage });

    let slug = slugify(title).slice(0, 160) || "article";

    const existingSlug = await Blog.findOne({ slug });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const coverImage = getUploadedFileUrl(req.file);

    const blog = await Blog.create({
      title,
      slug,
      excerpt: String(excerpt || "").trim(),
      content: String(content || ""),
      coverImage,
      coverImageAlt: String(req.body.coverImageAlt || "").trim(),
      category: category || "",
      tags: normalizeTags(tags),
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      authorName: String(authorName || "").trim().slice(0, 120),
      authorImage: normalizeAuthorImage(authorImage),
      author: req.user._id,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? new Date() : null
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

exports.updateBlog = async (req, res, next) => {
  try {
    const {
      title,
      excerpt,
      content,
      status,
      category,
      tags,
      metaTitle,
      metaDescription
    } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const wasDraft = blog.status === "draft";

    // Keep article URLs stable when editorial copy is revised.
    if (title) blog.title = title;

    if (typeof excerpt === "string") blog.excerpt = excerpt;
    if (typeof content === "string") blog.content = content;
    if (typeof category === "string") blog.category = category;
    if (typeof tags !== "undefined") blog.tags = normalizeTags(tags);
    if (typeof metaTitle === "string") blog.metaTitle = metaTitle;
    if (typeof metaDescription === "string") {
      blog.metaDescription = metaDescription;
    }
    if (typeof req.body.coverImageAlt === "string") blog.coverImageAlt = req.body.coverImageAlt.trim();
    if (typeof req.body.authorName === "string") blog.authorName = req.body.authorName.trim().slice(0, 120);
    if (typeof req.body.authorImage === "string") blog.authorImage = normalizeAuthorImage(req.body.authorImage);

    const uploadedCover = getUploadedFileUrl(req.file);

    if (uploadedCover) {
      blog.coverImage = uploadedCover;
    }

    if (status && ["draft", "published"].includes(status)) {
      blog.status = status;
    }

    const validationMessage = getArticleValidationMessage(
      blog.toObject(),
      wasDraft && blog.status === "published"
    );
    if (validationMessage) return res.status(400).json({ success: false, message: validationMessage });

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

exports.getArticleValidationMessage = getArticleValidationMessage;
exports.normalizeAuthorImage = normalizeAuthorImage;

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

exports.getNewsletterSubscribers = async (req, res, next) => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({
      createdAt: -1
    });

    res.json({
      success: true,
      subscribers
    });
  } catch (error) {
    next(error);
  }
};
