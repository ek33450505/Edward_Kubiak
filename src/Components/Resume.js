import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

const resumeData = {
  name: "Edward Kubiak",
  email: "EK33433450805@mailfence.com",
  location: "Columbus, Ohio, USA",
  summary:
    "Accomplished Application Developer with extensive experience in both front-end and back-end development. Specializes in crafting scalable applications and enhancing existing software systems. Skilled in various programming languages and frameworks, such as AngularJS, PHP, Python, and React. Currently improving application performance and user interaction at META Solutions by transitioning legacy systems to modern architectures.",
  skills: [
    "MERN Stack Development (MongoDB, Express.js, React.js, Node.js)",
    "JavaScript, jQuery",
    "Proficiency in AngularJS",
    "Python Backend Development",
    "PHP Backend Development",
    "Integration of Third-Party APIs",
    "Design and Implementation of Server-Side APIs",
    "SQL Database Management",
    "Database Configuration",
  ],
  experience: [
    {
      role: "Application Developer",
      company: "META Solutions",
      location: "Columbus, OH",
      period: "August 2022 – Present",
      responsibilities: [
        "Led the transformation of CrossCheck, a key application for educational administration, from Angular.js to React.js, enhancing functionality and user experience for approximately 4,200 users across over 900 school districts in Ohio.",
        "Demonstrated proficiency in Angular.js, PHP, Python, and React by successfully addressing legacy code challenges and implementing advanced development practices.",
        "Revamped an existing internal application originally written in Angular.js, deploying a full rewrite using React.js and Node.js within the first year and a half, and integrated it with the existing Python API to improve performance and maintainability.",
      ],
    },
  ],
  education: [
    {
      degree: "Full Stack Web Development",
      institution: "The Ohio State University",
      period: "January 2022 – July 2022",
    },
    {
      degree: "Bachelor of Science",
      institution: "Ohio University",
      period: "August 2005 – June 2009",
    },
  ],
};


const Resume = () => (
  <Container className="resume-container mt-4">
    <Row>
      <Col md={12} className="resume-card">
        <h1 className="resume-header">{resumeData.name}</h1>
        <p className="contact-info">
          <FontAwesomeIcon icon={faEnvelope} />{" "}
          <a href={`mailto:${resumeData.email}`} className="email-link"
          >
            {resumeData.email}
          </a>{" "}
          | <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
          <a
            href="https://www.google.com/maps?q=Columbus,+Ohio,+USA"
            target="_blank"
            rel="noopener noreferrer"
            className="location-link"
          >
            {resumeData.location}
          </a>
        </p>

        <h2 className="section-title">Summary</h2>
        <p className="summary-text">{resumeData.summary}</p>

        <h2 className="section-title">Skills</h2>
        <div className="skills-list">
          {resumeData.skills.map((skill, index) => (
            <Badge key={index} pill bg="dark" className="skill-item">
              {skill}
            </Badge>
          ))}
        </div>

        <h2 className="section-title">Professional Experience</h2>
        {resumeData.experience.map((job, index) => (
          <div key={index} className="job-experience">
            <p>
              <strong>{job.role}</strong>, {job.company}, {job.location} (
              {job.period})
            </p>
            <ul>
              {job.responsibilities.map((responsibility, i) => (
                <li key={i} className="responsibilityText">{responsibility}</li>
              ))}
            </ul>
          </div>
        ))}

        <h2 className="section-title">Education</h2>
        {resumeData.education.map((edu, index) => (
          <p key={index}>
            <strong>{edu.degree}</strong>, {edu.institution} ({edu.period})
          </p>
        ))}
      </Col>
    </Row>
  </Container>
);

export default Resume;
