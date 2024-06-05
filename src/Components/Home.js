import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const IntroText = ({ text }) => (
  <div className="homesmallprint intro-text">
    <p>{text}</p>
  </div>
);

const SkillsList = () => (
  <ul>
    <li>Application Specialist with Full Stack MERN Expertise</li>
    <li>Proficient in Front-End Development with React</li>
    <li>Expert in Refactoring and Modernizing Legacy Code</li>
    <li>Passionate about UI/UX Design</li>
  </ul>
);


const Home = () => {
  return (
    <Container className="mt-4">
      <Row>
        <Col className="homename">
          <h1>Full Stack Developer | App Specialist</h1>
        </Col>
      </Row>
      <Row>
        <Col md={6} className="hometext">
          <IntroText text="Crafting responsive, scalable web apps with a focus on front-end magic." />
        </Col>
        <Col md={6} className="hometext">
          <IntroText text="Explore my portfolio for innovative projects, or reach out to discuss opportunities." />
        </Col>
      </Row>
      <Row>
        <Col className="hometext-skills">
          <h2>Core Competencies</h2>
          <SkillsList />
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
