import { MdArrowOutward, MdCopyright } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa6";
import "./styles/Contact.css";
import { config } from "../config";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  useEffect(() => {
    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    // Animate title from bottom
    contactTimeline.fromTo(
      ".contact-section h3",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }
    );

    // Animate contact boxes with stagger from bottom
    contactTimeline.fromTo(
      ".contact-box",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      },
      "-=0.4"
    );

    // Clean up
    return () => {
      contactTimeline.kill();
    };
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>{config.developer.fullName}</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>WhatsApp</h4>
            <p>
              <a
                href={config.social.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-highlight-link"
              >
                {config.social.whatsapp}
              </a>
            </p>
            <h4>Email</h4>
            <p>
              <a href={`mailto:${config.social.email}`} data-cursor="disable">
                {config.social.email}
              </a>
            </p>
            <h4>Location</h4>
            <p>
              <span>{config.social.location}</span>
            </p>
          </div>
          <div className="contact-box">
            <h4>Social Links</h4>
            <a
              href={config.contact.github}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              GitHub <MdArrowOutward />
            </a>
            <a
              href={config.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Instagram <MdArrowOutward />
            </a>
            <a
              href={config.social.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              WhatsApp <MdArrowOutward />
            </a>
          </div>
          <div className="contact-box contact-developer-box">
            <div className="contact-developer-card">
              <div className="contact-avatar-wrap">
                <img
                  src="/images/usman.jpg"
                  alt={config.developer.fullName}
                  className="contact-avatar-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="contact-card-info">
                <h4>{config.developer.fullName}</h4>
                <p>{config.developer.title}</p>
                <a
                  href={config.social.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-cta-btn"
                  data-cursor="disable"
                >
                  <FaWhatsapp /> Let's Talk
                </a>
              </div>
            </div>
            <h2>
              Designed and Developed <br /> by <span>{config.developer.fullName}</span>
            </h2>
            <h5>
              <MdCopyright /> {new Date().getFullYear()}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
