import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import runBuddy from '../Images/runBuddy.png';
import recipe from '../Images/recipeSearch.png';
// import weather from "./Images/weatherAPI.png";
// import budget from "./Images/budgetTracker.png";
// import deepThoughts from "./Images/deepThoughts.png";
// import rentIt from "./Images/rentIt.png";
// import i from "./Images/i++.png";

const projects = [
  {
    title: "Run Buddy",
    image: runBuddy,
    link: "https://ek33450505.github.io/run-buddy/"
  },
  // {
  //   title: "Weather API",
  //   image: weather,
  //   link: "https://ek33450505.github.io/Weather-Dashboard/"
  // },
  {
    title: "Recipe Search",
    image: recipe,
    link: "https://drspookyfox.github.io/RecipeSearch/"
  },
  // {
  //   title: "i++",
  //   image: i,
  //   link: "https://peaceful-beach-75980.herokuapp.com/"
  // },
  // {
  //   title: "Budget Tracker",
  //   image: budget,
  //   link: "https://arcane-ridge-99098.herokuapp.com/"
  // },
  // {
  //   title: "Deep Thoughts",
  //   image: deepThoughts,
  //   link: "https://radiant-everglades-23747.herokuapp.com/"
  // },
  // {
  //   title: "Rent It",
  //   image: rentIt,
  //   link: "https://app-rentit.herokuapp.com/"
  // }
];

function Portfolio() {
  return (
    <Container className="mt-4">
      <h1 className="homename">Projects</h1>
      <Row>
        {projects.map((project, index) => (
          <Col md={6} key={index} className="mb-4">
            <Card className="project-card">
              <a href={project.link} target="_blank" rel="noopener noreferrer">
                <Card.Img variant="top" src={project.image} alt={project.title} className="project-image" />
                <Card.Body>
                  <Card.Title>{project.title}</Card.Title>
                </Card.Body>
              </a>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Portfolio;
