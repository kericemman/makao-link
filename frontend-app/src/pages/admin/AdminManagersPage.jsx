import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiSave, FiShield, FiUserPlus, FiUserX } from "react-icons/fi";
import {
  createAdminManager,
  getAdminManagers,
  resendAdminManagerInvitation,
  revokeAdminManager,
  updateAdminManagerPermissions
} from "../../services/admin.service";
import { normalizeAdminPermissions } from "../../utils/adminPermissions";

const emptyInvite = { name: "", email: "", phone: "", permissions: [] };
const getRequestError = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.isAxiosError && !error.response) {
    return "Could not reach the server. Check your connection and try again.";
  }
  return error.message || fallback;
};

const FeedbackNotice = ({ feedback }) => {
  if (!feedback) return null;
  const isError = feedback.type === "error";
  const isWarning = feedback.type === "warning";
  const Icon = isError || isWarning ? FiAlertCircle : FiCheckCircle;
  const colors = isError
    ? "border-red-200 bg-red-50 text-red-800"
    : isWarning
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"} className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${colors}`}>
      <Icon className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{feedback.message}</span>
    </div>
  );
};

const PermissionChoices = ({ value, onChange, idPrefix, catalog }) => {
  const selectedPermissions = normalizeAdminPermissions(value);

  const togglePermission = (permission) => {
    onChange((current) => {
      const selected = normalizeAdminPermissions(current);
      return selected.includes(permission)
        ? selected.filter((key) => key !== permission)
        : [...selected, permission];
    });
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {catalog.map((permission) => (
        <label key={`${idPrefix}-${permission.key}`} className="flex cursor-pointer items-start gap-2 rounded-md border border-[#DDEAE3] p-3 hover:bg-[#F7FBF8]">
          <input
            type="checkbox"
            checked={selectedPermissions.includes(permission.key)}
            onChange={() => togglePermission(permission.key)}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#0D915C]"
          />
          <span>
            <span className="block text-sm font-semibold text-[#013E43]">{permission.label}</span>
            <span className="mt-0.5 block text-xs leading-5 text-[#55706A]">{permission.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
};

export default function AdminManagersPage() {
  const [managers, setManagers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(emptyInvite);
  const [editing, setEditing] = useState("");
  const [editPermissions, setEditPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const activeCount = useMemo(() => managers.filter((manager) => manager.status === "active").length, [managers]);

  const loadManagers = async () => {
    setLoadError("");
    try {
      setLoading(true);
      const data = await getAdminManagers();
      setManagers(Array.isArray(data.managers)
        ? data.managers.filter((manager) => manager && typeof manager === "object").map((manager) => ({
            ...manager,
            permissions: normalizeAdminPermissions(manager.permissions)
          }))
        : []);
      setCatalog(Array.isArray(data.permissions)
        ? data.permissions.filter((permission) => permission && typeof permission.key === "string")
        : []);
    } catch (error) {
      setLoadError(getRequestError(error, "Could not load admin managers. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadManagers(); }, []);

  const invite = async (event) => {
    event.preventDefault();
    setFeedback(null);
    if (!form.permissions.length) {
      setFeedback({ type: "error", message: "Select at least one permission before creating the manager." });
      return;
    }
    try {
      setSaving(true);
      const result = await createAdminManager(form);
      if (!result.success) throw new Error(result.message || "The manager could not be created.");
      setFeedback({
        type: result.inviteSent ? "success" : "warning",
        message: result.message || (result.inviteSent
          ? "Manager created and setup email sent."
          : "Manager access was saved, but the setup email was not sent. Use Resend setup email after checking email service configuration.")
      });
      setForm(emptyInvite);
      await loadManagers();
    } catch (error) {
      setFeedback({ type: "error", message: getRequestError(error, "Could not create the admin manager. Check the details and try again.") });
    } finally { setSaving(false); }
  };

  const beginEdit = (manager) => {
    setEditing(manager._id);
    setEditPermissions(normalizeAdminPermissions(manager.permissions));
  };

  const savePermissions = async (manager) => {
    setFeedback(null);
    if (!editPermissions.length) {
      setFeedback({ type: "error", message: "Select at least one permission before saving access." });
      return;
    }
    try {
      setSaving(true);
      if (manager.status === "revoked") {
        const result = await createAdminManager({
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          permissions: editPermissions
        });
        if (!result.success) throw new Error(result.message || "Manager access could not be reactivated.");
        setFeedback({
          type: result.inviteSent ? "success" : "warning",
          message: result.message || (result.inviteSent
            ? "Manager access reactivated and setup email sent."
            : "Manager access was reactivated, but the setup email was not sent. Use Resend setup email after checking email service configuration.")
        });
      } else {
        await updateAdminManagerPermissions(manager._id, editPermissions);
        setFeedback({ type: "success", message: "Manager permissions updated successfully." });
      }
      setEditing("");
      await loadManagers();
    } catch (error) {
      setFeedback({ type: "error", message: getRequestError(error, "Could not update manager access. Your changes were not confirmed; try again.") });
    } finally { setSaving(false); }
  };

  const resendInvite = async (manager) => {
    setFeedback(null);
    try {
      setSaving(true);
      const result = await resendAdminManagerInvitation(manager._id);
      if (!result.success) throw new Error(result.message || "The setup email could not be sent.");
      setFeedback({ type: "success", message: result.message || "A new setup link was emailed." });
    } catch (error) {
      setFeedback({ type: "error", message: getRequestError(error, "Could not resend setup email. Check email service configuration and try again.") });
    } finally { setSaving(false); }
  };

  const revoke = async (manager) => {
    if (!window.confirm(`Revoke admin manager access for ${manager.name}?`)) return;
    setFeedback(null);
    try {
      setSaving(true);
      await revokeAdminManager(manager._id);
      setFeedback({ type: "success", message: `Admin manager access revoked for ${manager.name}.` });
      await loadManagers();
    } catch (error) {
      setFeedback({ type: "error", message: getRequestError(error, "Could not revoke manager access. Try again.") });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <FeedbackNotice feedback={feedback} />
      <header className="flex flex-col gap-3 border-b border-[#DDEAE3] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0D915C]">Access control</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#013E43]">Admin managers</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#55706A]">Grant specific admin areas to trusted team members. Super-admin controls remain restricted.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#55706A]">
          <span><strong className="text-[#013E43]">{activeCount}</strong> active</span>
          <button onClick={loadManagers} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-[#DDEAE3] px-3 py-2 font-medium text-[#013E43] hover:bg-white disabled:opacity-50">
            <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      <section className="border-b border-[#DDEAE3] pb-6">
        <div className="mb-4 flex items-center gap-2">
          <FiUserPlus className="text-[#0D915C]" />
          <h3 className="font-semibold text-[#013E43]">Invite a manager</h3>
        </div>
        <form onSubmit={invite} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input required maxLength={120} placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-md border border-[#C8D8D0] px-3 py-2.5 text-sm outline-none focus:border-[#0D915C]" />
            <input required type="email" maxLength={254} placeholder="New, unused email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-md border border-[#C8D8D0] px-3 py-2.5 text-sm outline-none focus:border-[#0D915C]" />
            <input type="tel" maxLength={32} placeholder="Phone (optional)" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-md border border-[#C8D8D0] px-3 py-2.5 text-sm outline-none focus:border-[#0D915C]" />
          </div>
          <p className="text-xs text-[#55706A]">Use an email that is not already registered with RendaHomes. The invitee receives a single-use password setup link that expires after 30 minutes.</p>
          <PermissionChoices value={form.permissions} onChange={(update) => setForm((current) => ({ ...current, permissions: update(current.permissions) }))} idPrefix="invite" catalog={catalog} />
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#0D915C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#08764A] disabled:opacity-50">
            <FiUserPlus /> {saving ? "Saving..." : "Create manager and send setup email"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FiShield className="text-[#0D915C]" />
          <h3 className="font-semibold text-[#013E43]">Manager access</h3>
        </div>
        {loadError ? (
          <div className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p role="alert" className="flex items-start gap-2 text-sm text-red-700"><FiAlertCircle className="mt-0.5 shrink-0" />{loadError}</p>
            <button onClick={loadManagers} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-medium text-[#013E43] hover:bg-white disabled:opacity-50"><FiRefreshCw className={loading ? "animate-spin" : ""} /> Try again</button>
          </div>
        ) : loading ? <p className="py-8 text-sm text-[#55706A]">Loading managers...</p> : managers.length === 0 ? (
          <p className="py-8 text-sm text-[#55706A]">No admin managers yet.</p>
        ) : (
          <div className="divide-y divide-[#DDEAE3] border-y border-[#DDEAE3]">
            {managers.map((manager) => (
              <article key={manager._id} className="py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-[#013E43]">{manager.name}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${manager.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{manager.status}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-[#55706A]">{manager.email}{manager.phone ? ` · ${manager.phone}` : ""}</p>
                    <p className="mt-2 text-xs leading-5 text-[#55706A]">
                      {(manager.permissions || []).map((key) => catalog.find((item) => item.key === key)?.label || key).join(" · ") || "No permissions"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manager.status === "active" && <>
                      <button onClick={() => editing === manager._id ? setEditing("") : beginEdit(manager)} className="rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-medium text-[#013E43] hover:bg-[#F7FBF8]">{editing === manager._id ? "Cancel" : "Edit access"}</button>
                      <button onClick={() => resendInvite(manager)} disabled={saving} className="rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-medium text-[#013E43] hover:bg-[#F7FBF8]">Resend setup email</button>
                      <button onClick={() => revoke(manager)} disabled={saving} aria-label={`Revoke ${manager.name}`} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"><FiUserX /> Revoke</button>
                    </>}
                    {manager.status === "revoked" && <button onClick={() => editing === manager._id ? setEditing("") : beginEdit(manager)} className="rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-medium text-[#013E43] hover:bg-[#F7FBF8]">{editing === manager._id ? "Cancel" : "Reactivate"}</button>}
                  </div>
                </div>
                {editing === manager._id && (
                  <div className="mt-4 space-y-3 border-t border-[#DDEAE3] pt-4">
                    <PermissionChoices value={editPermissions} onChange={setEditPermissions} idPrefix={manager._id} catalog={catalog} />
                    <div className="flex justify-end">
                      <button onClick={() => savePermissions(manager)} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#0D915C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#08764A] disabled:opacity-50"><FiSave /> Save access</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="text-xs leading-5 text-[#667B75]">New managers set a password and verify their email from a single-use link that expires after 30 minutes, then sign in to the Admin Portal. Reactivated managers use their existing account.</p>
    </div>
  );
}
