import React, { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import emailjs from "emailjs-com";

const Contact = () => {
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact((prevContact) => ({
      ...prevContact,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendEmail();
  };

  const sendEmail = () => {
    emailjs
      .send(
        "service_3s5ab1g",
        "template_f60yrhd",
        {
          name: contact.name,
          email: contact.email,
          message: contact.message
        },
        "WTYFJrOiiMJYk8W7h"
      )
      .then(
        (response) => {
          // console.log("SUCCESS!", response.status, response.text);
          alert("Message sent successfully! I will get back to you soon.");
          setContact({
            name: "",
            email: "",
            message: ""
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        },
        (error) => {
          console.log("FAILED...", error);
          alert("Failed to send the message. Please try again.");
        }
      );
  };

  return (
    <Container className="contact-container mt-4">
      <h1 className="homename">Contact Me</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={contact.name}
            onChange={handleChange}
            required
            placeholder="Your Name"
          />
        </Form.Group>
        <Form.Group controlId="formEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={contact.email}
            onChange={handleChange}
            required
            placeholder="Your Email"
          />
        </Form.Group>
        <Form.Group controlId="formMessage">
          <Form.Label>Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="message"
            value={contact.message}
            onChange={handleChange}
            required
            placeholder="Lets Connect..."
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export default Contact;
