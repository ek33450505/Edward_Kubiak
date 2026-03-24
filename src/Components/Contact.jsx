import { useState } from "react";
import { motion } from "motion/react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

const Contact = () => {
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          name: contact.name,
          email: contact.email,
          message: contact.message,
          subject: `Portfolio contact from ${contact.name}`,
          botcheck: "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({
          type: "success",
          message: "Message sent! I'll be in touch soon.",
        });
        setContact({ name: "", email: "", message: "" });
      } else {
        throw new Error(data.message);
      }
    } catch {
      setStatus({
        type: "error",
        message: "Failed to send. Please try again or email me directly.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Let&apos;s Build <span className="text-amber-400">Something</span>
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-amber-400/60" />
          <p className="mt-4 text-slate-400">
            Whether you need a full-stack developer, an AI-powered tool, or a
            legacy system rescued from the past — I&apos;d love to hear about it.
          </p>
        </motion.div>

        {/* Status message */}
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 flex items-center gap-3 px-4 py-3 rounded-lg border ${
              status.type === "success"
                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                : "bg-rose-400/10 border-rose-400/20 text-rose-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="text-sm">{status.message}</span>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="block font-display text-xs tracking-[0.2em] text-slate-400 uppercase mb-2"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={contact.name}
              onChange={handleChange}
              required
              placeholder="Your name"
              maxLength={100}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800/60 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all duration-300"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-display text-xs tracking-[0.2em] text-slate-400 uppercase mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={contact.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              maxLength={254}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800/60 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all duration-300"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block font-display text-xs tracking-[0.2em] text-slate-400 uppercase mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={contact.message}
              onChange={handleChange}
              required
              placeholder="Tell me about your project — what are you building, and what's the biggest challenge?"
              maxLength={5000}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800/60 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all duration-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-950 font-display text-sm tracking-wider uppercase font-bold rounded-lg hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                Send It
                <Send size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default Contact;
