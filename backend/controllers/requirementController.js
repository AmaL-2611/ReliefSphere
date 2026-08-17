const Requirement = require("../models/requirementModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const { createNotification } = require("../utils/aiMatcher");

/* ─── Create Requirement ─── */
exports.createRequirement = async (req, res) => {
  try {
    const {
      category,
      title,
      description,
      quantity,
      unit,
      beneficiaryType,
      beneficiaryCount,
      requiredBefore,
      imageUrl,
      urgency,
      location,
      latitude,
      longitude,
    } = req.body;

    // Find org profile of logged-in user or auto-create if missing
    let org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) {
      org = await RecipientOrganization.create({
        userId: req.user._id,
        orgName: req.user.fullName || "Organization",
        orgType: "ngo",
        address: location || "",
        verificationStatus: "verified",
      });
    } else if (org.verificationStatus !== "verified") {
      org.verificationStatus = "verified";
      await org.save();
    }

    const requirement = await Requirement.create({
      organizationId: org._id,
      postedBy: req.user._id,
      category: category || "food",
      title,
      description,
      quantity: Number(quantity),
      unit: unit || "Packets",
      beneficiaryType: beneficiaryType || "General Community",
      beneficiaryCount: Number(beneficiaryCount || 0),
      requiredBefore: requiredBefore ? new Date(requiredBefore) : null,
      imageUrl: imageUrl || "",
      urgency: urgency || "medium",
      location: location || org.address || "",
      latitude: latitude ? Number(latitude) : org.latitude || null,
      longitude: longitude ? Number(longitude) : org.longitude || null,
    });

    res.status(201).json({ message: "Requirement posted successfully.", requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get All Open Requirements (public / donor view) ─── */
exports.getRequirements = async (req, res) => {
  try {
    const { category, urgency, status } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (urgency && urgency !== "all")   filter.urgency = urgency;
    filter.status = status || "open";

    const requirements = await Requirement.find(filter)
      .populate("organizationId", "orgName orgType address")
      .populate("postedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json({ requirements, total: requirements.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get My Requirements (organization) ─── */
exports.getMyRequirements = async (req, res) => {
  try {
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) return res.status(403).json({ message: "Organization not found." });

    const requirements = await Requirement.find({ organizationId: org._id })
      .sort({ createdAt: -1 });

    const stats = {
      total: requirements.length,
      pending: requirements.filter((r) => r.status === "pending").length,
      open: requirements.filter((r) => r.status === "open").length,
      matched: requirements.filter((r) => r.status === "matched").length,
      fulfilled: requirements.filter((r) => r.status === "fulfilled").length,
      rejected: requirements.filter((r) => r.status === "rejected").length,
    };

    res.json({ requirements, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Single Requirement ─── */
exports.getRequirementById = async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id)
      .populate("organizationId", "orgName orgType address latitude longitude")
      .populate("postedBy", "fullName email");

    if (!requirement) return res.status(404).json({ message: "Requirement not found." });
    res.json({ requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Update Requirement (organization owner) ─── */
exports.updateRequirement = async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    // Only owner org can update
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org || requirement.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (requirement.status !== "open" && requirement.status !== "pending") {
      return res.status(400).json({ message: "Only open or pending requirements can be edited." });
    }

    const fields = ["category", "title", "description", "quantity", "urgency", "location", "latitude", "longitude"];
    fields.forEach((f) => { if (req.body[f] !== undefined) requirement[f] = req.body[f]; });
    await requirement.save();

    res.json({ message: "Requirement updated.", requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Delete Requirement (organization owner) ─── */
exports.deleteRequirement = async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org || requirement.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (requirement.status !== "open" && requirement.status !== "pending" && requirement.status !== "rejected") {
      return res.status(400).json({ message: "Cannot delete requirements that are in progress or fulfilled." });
    }

    await requirement.deleteOne();
    res.json({ message: "Requirement deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Update Status (Approve / Reject) ─── */
exports.updateRequirementStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const requirement = await Requirement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("postedBy", "fullName email");

    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    // Send system notification to the organization user
    if (requirement.postedBy) {
      if (status === "open") {
        await createNotification(
          requirement.postedBy._id || requirement.postedBy,
          "Requirement Approved",
          `Your requirement "${requirement.title}" has been approved by the Admin and is now live for donors.`,
          "system"
        );
      } else if (status === "rejected") {
        await createNotification(
          requirement.postedBy._id || requirement.postedBy,
          "Requirement Rejected",
          `Your requirement "${requirement.title}" was rejected by the Admin.`,
          "system"
        );
      }
    }

    res.json({ message: `Requirement status updated to ${status}.`, requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Get All Requirements ─── */
exports.getAllRequirements = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;

    const requirements = await Requirement.find(filter)
      .populate("organizationId", "orgName orgType address")
      .populate("postedBy", "fullName email")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Requirement.countDocuments(),
      pending: await Requirement.countDocuments({ status: "pending" }),
      open: await Requirement.countDocuments({ status: "open" }),
      matched: await Requirement.countDocuments({ status: "matched" }),
      fulfilled: await Requirement.countDocuments({ status: "fulfilled" }),
      rejected: await Requirement.countDocuments({ status: "rejected" }),
    };

    res.json({ requirements, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
