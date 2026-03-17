import { motion } from "motion/react";
import { Mail, MapPin, Download } from "lucide-react";

const skills = {
  Frontend: ["React 19", "Vite", "TypeScript", "Tailwind CSS", "AngularJS", "jQuery"],
  Backend: ["Node.js", "Express", "Python", "PHP", "REST APIs"],
  Data: ["SQLite", "MongoDB", "SQL", "BigQuery"],
  "AI & Tools": ["Claude API", "Ollama", "Git", "CI/CD", "Playwright"],
};

const skillColors = {
  Frontend: "bg-amber-400/10 text-amber-400",
  Backend: "bg-sky-400/10 text-sky-400",
  Data: "bg-emerald-400/10 text-emerald-400",
  "AI & Tools": "bg-rose-400/10 text-rose-400",
};

const labelColors = {
  Frontend: "text-amber-400",
  Backend: "text-sky-400",
  Data: "text-emerald-400",
  "AI & Tools": "text-rose-400",
};

const experience = [
  {
    role: "Application Developer",
    company: "META Solutions",
    location: "Columbus, OH",
    period: "August 2022 - Present",
    highlights: [
      "Led the transformation of CrossCheck from AngularJS to React, serving ~4,200 users across 900+ Ohio school districts.",
      "Built AI-powered tools integrating Claude API and Ollama for intelligent developer workflows.",
      "Revamped internal applications with React 19, Vite, and Express 5, improving performance and maintainability.",
      "Modernized legacy Angular, PHP, and jQuery systems into modern JavaScript stacks.",
    ],
  },
];

const education = [
  {
    degree: "Full Stack Web Development",
    institution: "The Ohio State University",
    period: "Jan 2022 - Jul 2022",
  },
  {
    degree: "Bachelor of Science",
    institution: "Ohio University",
    period: "Aug 2005 - Jun 2009",
  },
];

const Resume = () => (
  <div className="min-h-[calc(100vh-80px)] py-20">
    <div className="max-w-4xl mx-auto px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Edward <span className="text-amber-400">Kubiak</span>
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-amber-400/60" />
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <a
              href="mailto:EK33433450805@mailfence.com"
              className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <Mail size={14} /> EK33433450805@mailfence.com
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> Columbus, Ohio
            </span>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 p-6 rounded-xl border border-slate-800/60 bg-slate-900/30"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-3">
          Summary
        </h2>
        <p className="text-slate-300 leading-relaxed">
          Application Developer with extensive full-stack experience building and
          modernizing web applications. Specializing in React, Node.js, and AI/LLM
          integration. Currently transforming legacy systems into modern architectures
          at META Solutions, serving thousands of users across Ohio school districts.
        </p>
      </motion.div>

      {/* Skills grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
          Skills
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(skills).map(([category, items], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              className="p-5 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <h3 className={`font-display text-sm font-bold tracking-wider mb-3 ${labelColors[category]}`}>
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-display tracking-wider ${skillColors[category]}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
          Experience
        </h2>
        {experience.map((job) => (
          <div
            key={job.company}
            className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-100">
                  {job.role}
                </h3>
                <p className="text-amber-400 text-sm font-display">
                  {job.company} &mdash; {job.location}
                </p>
              </div>
              <span className="font-display text-xs tracking-wider text-slate-500 shrink-0">
                {job.period}
              </span>
            </div>
            <ul className="space-y-2">
              {job.highlights.map((h, i) => (
                <li key={i} className="text-sm text-slate-300 leading-relaxed pl-4 relative">
                  <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>

      {/* Education */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 mb-8"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
          Education
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {education.map((edu) => (
            <div
              key={edu.institution}
              className="p-5 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <h3 className="font-display text-sm font-bold text-slate-100">
                {edu.degree}
              </h3>
              <p className="text-slate-400 text-sm mt-1">{edu.institution}</p>
              <p className="font-display text-xs tracking-wider text-slate-500 mt-2">
                {edu.period}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

export default Resume;
