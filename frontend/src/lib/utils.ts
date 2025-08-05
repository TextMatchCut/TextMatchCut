import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDummySnippets() {
  const snippets = [
    {
      text: 'Web Dev is a dynamic field that constantly evolves with new technologies and frameworks. Staying updated is crucial for anyone looking to excel in this area. From front-end user interfaces to back-end server logic and database management, the scope is vast. Learning about responsive design ensures your websites look great on any device. Performance optimization is another key aspect that users greatly appreciate, leading to better engagement and lower bounce rates. Accessibility should also be a top priority for all projects.',
    },
    {
      text: 'Building interactive and engaging user experiences is at the core of modern software development. Many developers focus on mobile applications, but the reach and versatility of the web remain unparalleled. Understanding various programming languages like JavaScript, Python, or Ruby is fundamental. Mastering concepts such as API integration, server-side rendering, and client-side scripting empowers a developer. The continuous learning journey in Web Dev involves exploring new tools and best practices to deliver high-quality solutions. Security considerations are paramount to protect user data and ensure robust applications.',
    },
    {
      text: "The journey to becoming a proficient developer involves countless hours of practice and problem-solving. It's not just about writing code; it's about understanding complex systems and designing elegant solutions. Version control systems like Git are indispensable for collaborative projects, allowing teams to manage changes effectively. Debugging skills are equally important, helping to identify and fix issues efficiently. From design principles to deployment strategies, every stage requires attention to detail. Exploring different architectural patterns can significantly improve scalability and maintainability. A passion for continuous learning is what truly defines a successful professional in Web Dev.",
    },
    {
      text: 'Starting a career in technology often involves choosing a specialization. Many aspiring professionals gravitate towards mobile app development, while others find their niche in data science or cybersecurity. However, the foundational skills acquired in Web Dev are often transferable across multiple domains. This versatile skill set makes it a popular choice for many, offering a broad range of career opportunities in various industries.',
    },
    {
      text: 'Creating robust and scalable web applications requires a deep understanding of both client-side and server-side technologies. From choosing the right database to designing an intuitive user interface, every decision impacts the final product. Frameworks like React, Angular, and Vue.js have revolutionized front-end development, making complex interactions easier to manage. On the back-end, Node.js, Django, and Ruby on Rails provide powerful tools for building APIs and handling business logic. Continuous integration and continuous deployment (CI/CD) pipelines streamline the development process, ensuring faster releases. The demand for skilled professionals in Web Dev continues to grow globally, driven by the increasing digitalization of businesses.',
    },
  ];
  return snippets.map(snippet => {
    const Lines = snippet.text.split('. ').map(line => line.trim());
    return {
      HighlightIndex: Lines.findIndex(line => line.includes('Web Dev')),
      Lines,
    };
  });
}

/**
 * Converts a hex color string to an RGBA array.
 * Handles #RGB, #RRGGBB, and #RRGGBBAA formats.
 * @param hex The hex color string.
 * @returns An array [r, g, b, a] where r, g, b are 0-255 and a is 0-1.
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  if (!hex) return [0, 0, 0, 255];

  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(
    shorthandRegex,
    (m, r, g, b) => r + r + g + g + b + b
  );

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    fullHex
  );

  if (!result) {
    console.warn(`Invalid hex color: ${hex}. Defaulting to black.`);
    return [0, 0, 0, 1];
  }

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    result[4] !== undefined ? parseInt(result[4], 16) / 255 : 255,
  ];
}

/**
 * Converts an RGBA color array to a hex string.
 * @param rgba An array [r, g, b, a] where r, g, b are 0-255 and a is 0-1.
 * @param includeAlpha Whether to include the alpha channel in the output string.
 * @returns A hex color string in #RRGGBB or #RRGGBBAA format.
 */
export function rgbaToHex(
  rgba: [number, number, number, number],
  includeAlpha: boolean = true
): string {
  const [r, g, b, a] = rgba;

  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  return includeAlpha ? `${hex}${toHex(a * 255)}` : hex;
}

export async function loadWasmBackend() {
  const go = new Go();
  await WebAssembly.instantiateStreaming(
    fetch('lib.wasm'),
    go.importObject
  ).then(result => {
    console.log('WASM loaded successfully');
    go.run(result.instance);
  });
}

export const loadFFmpeg = async (ffmpeg: FFmpeg) => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm';
  // ffmpeg.on('log', ({ message }) => {
  //   if (messageRef.current) messageRef.current.innerHTML = message;
  // });
  // toBlobURL is used to bypass CORS issue, urls with the same
  // domain can be used directly.
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      'text/javascript'
    ),
  });
  console.log('FFmpeg loaded successfully');
};
