import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaGithub } from "react-icons/fa";

import Home from "./Components/Home";
import About from "./Components/About";
import Portfolio from "./Components/Portfolio";
import Resume from "./Components/Resume";
import Contact from "./Components/Contact";
import BrandingImage from "./Images/Brand.webp";

function App() {
  const [expanded, setExpanded] = useState(false);

  const handleNavLinkClick = () => {
    setExpanded(false);
  };

  return (
    <Router>
      <div className="App">
        <header>
          <Navbar expand="lg" className="navBar-main" sticky="top" expanded={expanded}>
            <Container>
              <Navbar.Brand as={Link} to="/" className="font-weight-bold">
                <img src={BrandingImage} alt="Branding Logo" height="30" className="brandLogo" />
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setExpanded(!expanded)} />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/about" onClick={handleNavLinkClick}>
                    About
                  </Nav.Link>
                  <Nav.Link as={Link} to="/projects" onClick={handleNavLinkClick}>
                    Projects
                  </Nav.Link>
                  <Nav.Link as={Link} to="/resume" onClick={handleNavLinkClick}>
                    Resume
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contact" onClick={handleNavLinkClick}>
                    Contact
                  </Nav.Link>
                </Nav>
              </Navbar.Collapse>
              <Nav.Link
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub Profile"
                className="github-icon"
              >
                <FaGithub size={25} />
              </Nav.Link>
            </Container>
          </Navbar>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Portfolio />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
