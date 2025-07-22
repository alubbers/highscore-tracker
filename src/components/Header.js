"use strict";

/**
 * Main App component for the High Score Tracker
 * This is the root component that sets up the overall layout and routing
 * Uses React Bootstrap for responsive mobile-first design
 */

import React from "react";
import { observer } from "mobx-react-lite";
import { Container, Navbar, Nav, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

export default (props) => {
  let viewName = props.viewName;
  if (!viewName) {
    viewName = "home";
  }

  {
    /* Navigation Header */
  }
  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand href="/">🏆 High Score Tracker</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/" active={viewName === "home"}>
              Games
            </Nav.Link>
            <Nav.Link href="/addGame" active={viewName === "addGame"}>
              Add Game
            </Nav.Link>
            <Nav.Link href="/addScore" active={viewName === "addScore"}>
              Add Score
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Item>
              Games: {props.gameCount} | Players: {props.playerCount}
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
        {/* Error Alert */}
        {props.hasError && (
          <Alert variant="danger" className="mb-3">
            <Alert.Heading>Error</Alert.Heading>
            <p>{props.error}</p>
          </Alert>
        )}

        {/* Loading Indicator */}
        {props.isLoading && (
          <div className="d-flex justify-content-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </Container>
    </Navbar>
  );
};
