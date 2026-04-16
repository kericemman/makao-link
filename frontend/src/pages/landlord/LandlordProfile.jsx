import { useEffect, useMemo, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../../services/user.service";
import { useAuth } from "../../context/AuthContext";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiFileText,
  FiBriefcase,
  FiCamera,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiRefreshCw,
  FiShield,
  FiImage,
  FiTrash2,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import { FaBuilding, FaKey, FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const LandlordProfilePage = () => {
  const { refreshAuth } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    bio: "",
    location: ""
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");

      const data = await getProfile();

      setProfileForm({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        businessName: data.user?.businessName || "",
        bio: data.user?.bio || "",
        location: data.user?.location || "",
        avatar: data.user?.avatar || ""
      });
      
      if (data.user?.avatar) {
        setAvatarPreview(data.user.avatar);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to load profile");
      toast.error("Failed to load profile", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAvatar = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB", {
          style: { background: "#013E43", color: "#fff" }
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file", {
          style: { background: "#013E43", color: "#fff" }
        });
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setProfileSuccess("");
      setProfileError("");

      const payload = new FormData();
      payload.append("name", profileForm.name);
      payload.append("phone", profileForm.phone);
      payload.append("businessName", profileForm.businessName);
      payload.append("bio", profileForm.bio);
      payload.append("location", profileForm.location);

      if (avatar) {
        payload.append("avatar", avatar);
      }

      const data = await updateProfile(payload);

      setProfileForm((prev) => ({
        ...prev,
        ...data.user
      }));

      await refreshAuth();
      setProfileSuccess("Profile updated successfully.");
      toast.success("Profile updated successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile");
      toast.error("Failed to update profile", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordSuccess("");
      setPasswordError("");

      const data = await changePassword(passwordForm);

      setPasswordSuccess(data.message || "Password updated successfully.");
      toast.success("Password updated successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to update password");
      toast.error("Failed to update password", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex items-center space-x-4">
          
          <div>
            <h1 className="text-xl font-bold text-[#013E43]">Profile & Settings</h1>
            <p className="text-sm text-[#065A57]">
              Manage your profile details and account security
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Profile Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
          <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
            <h2 className="text-lg font-semibold text-[#013E43] flex items-center">
              <FiUser className="mr-2 text-[#02BB31]" />
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center border-4 border-[#A8D8C1]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-3xl text-white" />
                  )}
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <FiTrash2 size={12} />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-2">
                  Profile Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatar}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0F7F4] border border-[#A8D8C1] rounded-lg cursor-pointer hover:bg-[#A8D8C1] transition-colors"
                  >
                    <FiCamera className="text-[#02BB31]" />
                    <span className="text-sm text-[#065A57]">Upload Photo</span>
                  </label>
                </div>
                <p className="text-xs text-[#065A57] mt-1">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    value={profileForm.email}
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="e.g., 0712345678"
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Business Name
                </label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    name="businessName"
                    value={profileForm.businessName}
                    onChange={handleProfileChange}
                    placeholder="Optional"
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Location
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    name="location"
                    value={profileForm.location}
                    onChange={handleProfileChange}
                    placeholder="City / Area"
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Bio / About
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-3 text-[#0D915C]" />
                  <textarea
                    rows="4"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell tenants a little about you or your company..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {profileSuccess && (
              <div className="bg-[#02BB31]/10 p-3 rounded-lg text-sm text-[#02BB31] flex items-center gap-2">
                <FiCheckCircle />
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <FiAlertCircle />
                {profileError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {savingProfile ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
          <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
            <h2 className="text-lg font-semibold text-[#013E43] flex items-center">
              <FiLock className="mr-2 text-[#02BB31]" />
              Change Password
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Current Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-10 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <FiEyeOff className="text-[#065A57]" />
                  ) : (
                    <FiEye className="text-[#065A57]" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-10 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <FiEyeOff className="text-[#065A57]" />
                  ) : (
                    <FiEye className="text-[#065A57]" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[#065A57] mt-1">
                Minimum 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-10 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="text-[#065A57]" />
                  ) : (
                    <FiEye className="text-[#065A57]" />
                  )}
                </button>
              </div>
            </div>

            {passwordSuccess && (
              <div className="bg-[#02BB31]/10 p-3 rounded-lg text-sm text-[#02BB31] flex items-center gap-2">
                <FiCheckCircle />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <FiAlertCircle />
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-3 bg-gradient-to-r from-[#013E43] to-[#005C57] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {savingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FiShield className="mr-2" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LandlordProfilePage;