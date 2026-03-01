import {
  About,
  Blog,
  Gallery,
  Home,
  Newsletter,
  Person,
  Social,
  Work,
} from "@/types";
import { Column, Line, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Davian",
  lastName: "Kho",
  name: `Davian Kho`,
  role: "Computer Engineer",
  avatar: "/images/avatar.jpg",
  email: "daviankho1@gmail.com",
  location: "Asia/Singapore", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English", "Mandarin"], // optional: Leave the array empty if you don't want to display languages
};

const newsletter: Newsletter = {
  display: false,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: <>My weekly newsletter about creativity and engineering</>,
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  // Set essentials: true for links you want to show on the about page
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/daviancold",
    essential: true,
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/davian-kho",
    essential: true,
  },
  {
    name: "Instagram",
    icon: "instagram",
    link: "https://www.instagram.com/daviancold",
    essential: true,
  },
  {
    name: "Threads",
    icon: "threads",
    link: "https://www.threads.com/@daviancold",
    essential: false,
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: <>Building my path from code to scalable systems</>,
  featured: {
    display: false,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Once UI</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured work
        </Text>
      </Row>
    ),
    href: "/work/building-once-ui-a-customizable-design-system",
  },
  subline: (
    <>
      I'm Davian, a computer engineer graduate at{" "}
      <Text as="span" size="xl" weight="strong">
        ONCE UI
      </Text>
      , where I craft intuitive user experiences. After hours, I build my own
      projects.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        I’m currently a computer engineer based in Singapore. I am passionate
        about building scalable and reliable software systems, as well as
        transforming complex technical challenges into elegant, maintainable
        solutions. My interests span backend development, cloud infrastructure,
        along with the convergence of software engineering and system design.
        I’m constantly playing around with new technologies and approaches to
        make software more efficient, resilient, and impactful.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "Aquariux Fintech",
        timeframe: "Jan 2026 - Present",
        role: "Backend Software Engineer Intern",
        achievements: [
          <>
            Implemented comprehensive unit testing using JUnit and Mockito for
            Springboot Service Layer, achieving 100% code coverage and improving
            reliability of core business logic.
          </>,
          <>
            Created a PostgreSQL data processing pipeline to transform and sort
            existing application logs into a new schema to support new business
            logic with scheduled cron job updates
          </>,
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
        ],
      },
      {
        company: "SPH Media",
        timeframe: "Jun 2025 - Sep 2025",
        role: "Software Engineer Intern",
        achievements: [
          <>
            Developed a new CI/CD pipeline on Github Actions that pulls upstream
            repositories and run test builds, ensuring base dependency changes
            do not lead to critical issues.
          </>,
          <>
            Enhanced the Backstage dashboard UI for OpenSearch logs, adding
            filtering and clearer alert-level distinctions to improve process
            monitoring.
          </>,
        ],
        images: [
          {
            src: "/images/about/about-02.jpg",
            alt: "SPH Media Group Photo",
            width: 16,
            height: 9,
          },
        ],
      },
      {
        company: "Hitachi Rail GTS",
        timeframe: "May 2024 - Dec 2024",
        role: "Software Engineer Intern",
        achievements: [
          <>
            Built a proof-of-concept microservices architecture that improved
            real-time video analytics and alert delivery, increasing frame rates
            and enabling filtering and sorting of alerts.
          </>,
          <>
            Experimented with Docker image layers to enable deployment into
            older edge devices and add compatibility with older dependencies.
          </>,
          <>
            Worked with configuration and set-up of a custom lightweight UNIX
            system to serve as MQTT Broker for local development usage.
          </>,
        ],
        images: [
          {
            src: "/images/about/about-01.jpg",
            alt: "Hitachi Rail GTS Group Photo",
            width: 16,
            height: 9,
          },
        ],
      },
      // Sample format below
      // {
      //   company: "FLY",
      //   timeframe: "2022 - Present",
      //   role: "Senior Design Engineer",
      //   achievements: [
      //     <>
      //       Redesigned the UI/UX for the FLY platform, resulting in a 20% increase in user
      //       engagement and 30% faster load times.
      //     </>,
      //     <>
      //       Spearheaded the integration of AI tools into design workflows, enabling designers to
      //       iterate 50% faster.
      //     </>,
      //   ],
      //   images: [
      //     // optional: leave the array empty if you don't want to display images
      //     {
      //       src: "/images/projects/project-01/cover-01.jpg",
      //       alt: "Once UI Project",
      //       width: 16,
      //       height: 9,
      //     },
      //   ],
      // },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Studies",
    institutions: [
      {
        name: "National University of Singapore",
        description: (
          <>
            <strong>Degree & Focus</strong>
            <Column as="ul" gap="16">
              <Text as="li" variant="body-default-m">
                Bachelor of Engineering (Honours), Computer Engineering
              </Text>
              <Text as="li" variant="body-default-m">
                Relevant Coursework: Data Structures, Real-Time Operating
                Systems, Software Engineering Principles, Information Security
              </Text>
            </Column>
            <strong>Roles</strong>
            <Column as="ul" gap="16">
              <Text as="li" variant="body-default-m">
                Teaching assistant for CS2113: Software Engineering & Object-Oriented Programming
              </Text>
              <Text as="li" variant="body-default-m">
                Student Advisor for CP2106: Independent Software Development Project (Orbital)
              </Text>
              <Text as="li" variant="body-default-m">
                NUS Muay Thai Fight Team Member & Former Vice-President
              </Text>
              <Text as="li" variant="body-default-m">
                Project Oceanus (Overseas Community Involvement Project) Member
              </Text>
            </Column>
            <strong>Achievements</strong>
            <Column as="ul" gap="16">
              <Text as="li" variant="body-default-m">
                Top Students for Computer Engineering Capstone Project
              </Text>
            </Column>
          </>
        ),
      },
      {
        name: "University of Gothenburg",
        description: (
          <>
            <strong>Student Exchange Program</strong>
            <Column as="ul" gap="16">
              <Text as="li" variant="body-default-m">
                Relevant Coursework: Databases, Computer Networks, Parallel
                Programming
              </Text>
            </Column>
          </>
        ),
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Technical skills",
    skills: [
      {
        title: "Backend",
        description: (
          <>
            Able to bootstrap event-driven services with databases, backend
            frameworks and runtimes
          </>
        ),
        tags: [
          {
            name: "PostgreSQL",
            icon: "postgresql",
          },
          {
            name: "MongoDB",
            icon: "mongodb",
          },
          {
            name: "SpringBoot",
            icon: "springboot",
          },
          {
            name: "ExpressJS",
            icon: "expressjs",
          },
          {
            name: "NodeJS",
            icon: "nodejs",
          },
          {
            name: "RabbitMQ",
            icon: "rabbitmq",
          },
          {
            name: "MQTT",
            icon: "mqtt",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [],
      },
      {
        title: "Infrastructure",
        description: (
          <>
            Dabbling and playing around with cloud infrastructure in my free
            time
          </>
        ),
        tags: [
          {
            name: "AWS",
            icon: "aws",
          },
          {
            name: "Oracle Cloud",
            icon: "oracle",
          },
          {
            name: "Kubernetes",
            icon: "kubernetes",
          },
          {
            name: "Prometheus",
            icon: "prometheus",
          },
          {
            name: "Grafana",
            icon: "grafana",
          },
          {
            name: "Terraform",
            icon: "terraform",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        // images: [
        //   {
        //     src: "/images/projects/project-01/cover-04.jpg",
        //     alt: "Project image",
        //     width: 16,
        //     height: 9,
        //   },
        // ],
      },
      {
        title: "Frontend",
        description: (
          <>Occasional simple webpage and dashboard implementations</>
        ),
        tags: [
          {
            name: "ReactJS",
            icon: "reactjs",
          },
          {
            name: "Next.js",
            icon: "nextjs",
          },
          {
            name: "TailwindCSS",
            icon: "tailwindcss",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Writing about design and tech...",
  description: `Read what ${person.name} has been up to recently`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `Design and dev projects by ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Photography Collection`,
  description: `A photo collection by ${person.name}`,
  // Images by https://lorant.one
  // These are placeholder images, replace with your own
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
