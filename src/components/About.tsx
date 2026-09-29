import "./styles/About.css";
import { config } from "../config";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">{config.about.title}</h3>
        <div className="about-mobile-avatar">
          <div className="about-avatar-frame">
            <img src="/images/usman.jpg" alt={config.developer.fullName} loading="lazy" decoding="async" />
          </div>
          <div className="about-avatar-info">
            <span className="about-avatar-name">{config.developer.fullName}</span>
            <span className="about-avatar-title">{config.developer.title}</span>
          </div>
        </div>
        <p className="para">
          {config.about.description}
        </p>
      </div>
    </div>
  );
};

export default About;
