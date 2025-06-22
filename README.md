# 3D Interactive Portfolio

This is a 3D interactive portfolio website built with:

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [React Three Drei](https://github.com/pmndrs/drei)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages
- `src/components/three`: 3D components using React Three Fiber
  - `BoxScene.tsx`: A simple 3D box scene
  - `Scene.tsx`: The main scene wrapper with camera and controls
- `src/components/SceneLayout.tsx`: Layout wrapper for the 3D scene

## Features

- Interactive 3D box with rotation animation
- Camera controls (orbit, pan, zoom)
- Responsive layout
- Development statistics panel (in development mode)

## Next Steps

Some ideas to enhance your portfolio:

1. Add more complex 3D models
2. Implement interactive animations
3. Create scene transitions
4. Add text and information sections
5. Implement custom shaders for unique visual effects
6. Add loading screen with progress indicator
7. Optimize for mobile devices

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
