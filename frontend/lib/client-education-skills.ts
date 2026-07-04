export type ClientEducationOption = {
  label: string;
  value: string;
};

export const CLIENT_JOB_CATEGORIES: ClientEducationOption[] = [
  { label: "Digital Marketing", value: "digital-marketing" },
  { label: "Graphics & Design", value: "graphics-design" },
  { label: "Video & Animation", value: "video-animation" },
  { label: "Programming & Tech", value: "programming-tech" },
  { label: "Writing & Translation", value: "writing-translation" },
];

export const CLIENT_JOB_SUBCATEGORIES: ClientEducationOption[] = [
  { label: "Logo Design", value: "logo-design" },
  { label: "Website Design", value: "website-design" },
  { label: "App Design", value: "app-design" },
  { label: "Brochure Design", value: "brochure-design" },
  { label: "Book Design", value: "book-design" },
];

export const POPULAR_SKILLS_BY_CATEGORY: Record<
  string,
  { heading: string; skills: string[] }
> = {
  "digital-marketing": {
    heading: "Digital Marketing",
    skills: [
      "SEO",
      "Social Media Marketing",
      "Google Ads",
      "Email Marketing",
      "Content Strategy",
      "Analytics",
      "Facebook Ads",
      "Copywriting",
    ],
  },
  "graphics-design": {
    heading: "Graphic Design",
    skills: [
      "Video Editing",
      "Graphic Design",
      "Web Design",
      "Logo Design",
      "2D Animation",
      "Wordpress",
      "Adobe Photoshop",
      "Adobe Illustrator",
    ],
  },
  "video-animation": {
    heading: "Video & Animation",
    skills: [
      "Video Editing",
      "Motion Graphics",
      "2D Animation",
      "3D Animation",
      "After Effects",
      "Premiere Pro",
      "Storyboarding",
      "Color Grading",
    ],
  },
  "programming-tech": {
    heading: "Programming & Tech",
    skills: [
      "React",
      "Node.js",
      "Python",
      "Flutter",
      "Firebase",
      "API Development",
      "Wordpress",
      "UI Development",
    ],
  },
  "writing-translation": {
    heading: "Writing & Translation",
    skills: [
      "Copywriting",
      "Proofreading",
      "Technical Writing",
      "Blog Writing",
      "Translation",
      "Creative Writing",
      "Editing",
      "Content Writing",
    ],
  },
};

export const DEFAULT_POPULAR_SKILLS =
  POPULAR_SKILLS_BY_CATEGORY["graphics-design"];
