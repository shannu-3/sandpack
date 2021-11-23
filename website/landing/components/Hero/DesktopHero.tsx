import {
  ClasserProvider,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
  SandpackThemeProvider,
} from "@codesandbox/sandpack-react";
import type { CSS } from "@stitches/react";
import {
  AnimateSharedLayout,
  useTransform,
  useViewportScroll,
} from "framer-motion";
import debounce from "lodash.debounce";
import React, { useLayoutEffect, useState, useRef, useMemo } from "react";

import {
  AnimatedBox,
  Box,
  Clipboard,
  Resources,
  SectionContainer,
  SectionWrapper,
  Text,
} from "../common";

import { SandpackText } from "./SandpackText";
import { app } from "./sandpackFiles";

// LOGO CONSTANTS
const BORDER_WIDTH = 2 * 14;
const SIDE_HEIGHT = 2 * 160;
const SIDE_WIDTH = 2 * 88;

const sharedLogoStyles: CSS = {
  borderWidth: BORDER_WIDTH,
  borderColor: "inherit",
  borderStyle: "solid",
  height: SIDE_HEIGHT,
  width: SIDE_WIDTH,
};

export const DesktopHero: React.FC = () => {
  // Hero dimensions
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroTop, setHeroTop] = useState(0);
  const [heroScroll, setHeroScroll] = useState(0);
  const [heroWidth, setHeroWidth] = useState(0);

  const [animationComplete, setAnimationComplete] = useState(false);

  // Subtitle should take 1/4 of the viewport's width
  const subTitleWidth = useMemo(() => heroWidth / 4, [heroWidth]);

  // Aligns logo positions to the center
  const logoTranslateX = useMemo(
    () => ({
      left: BORDER_WIDTH / 2,
      right: -1 * (BORDER_WIDTH / 2),
    }),
    []
  );

  // Scroll animations start
  const { scrollY } = useViewportScroll();

  // Container animations: container scale down + editor translate + preview scale

  // Scroll range for the container animation is from heroTop to 80%
  // of the hero's height
  const containerScrollInput = [heroTop, heroTop + heroScroll * 0.75];

  // Container's initial scale is 1, then it will scale down to 95%
  // of its original size for a subtle transition
  const heroContainerScale = useTransform(
    scrollY,
    containerScrollInput,
    [1, 0.975]
  );

  const heroHeight = heroTop + heroScroll;
  const heroSlideAway = useTransform(
    scrollY,
    [heroHeight, heroHeight + (2 / 3) * heroWidth], // 100vh = 2/3 of the hero's width.
    ["0", "-100%"]
  );

  // Editor's initial x0 is -1 * heroWidth / 2, it should translate the
  // amount equal to half of the window width so it's x0 = window's x0.
  // This way it will fill half of the screen.
  const editorTranslateX = useTransform(scrollY, containerScrollInput, [
    0,
    heroWidth / 2,
  ]);

  // Preview's width is equal to 100vw, it should scale on the x axis from
  // 1 (100vw) to 0.5 (vw). This way, when the editor slides in, it will take
  // the other half of the screen.
  const previewContainerScaleX = useTransform(
    scrollY,
    containerScrollInput,
    [1, 0.5]
  );

  // Reverse scale on preview's inner elements to prevent them from
  // looking "squished" as the preview scales down. It should be applied
  // on the children.
  const previewInnerScale = useTransform(
    scrollY,
    containerScrollInput,
    [1, 0.5]
  );

  // Preview inner animations

  // Divides preview scroll in 6 equal parts to coordinate
  // how the inner elements will animate
  const previewScrollInput = [
    heroTop,
    heroTop + heroScroll * 0.2,
    heroTop + heroScroll * 0.4,
    heroTop + heroScroll * 0.6,
    heroTop + heroScroll * 0.8,
    heroTop + heroScroll,
  ];

  // Animate logo as a whole

  // Starts at -90deg and when the logo sides intersect,
  // it rotates back to 0deg
  const logoRotateOutput = [-90, -90, -90, 0, 0, 0];
  const logoRotate = useTransform(
    scrollY,
    previewScrollInput,
    logoRotateOutput
  );

  // Animate left side of the logo
  // Step 1: from outer left to left side of subtitle
  // Step 2: from left side of subtitle to center
  // Step 3: stay at same position while outer element rotates
  // Step 4 - 6: "float" on scroll
  const logoLeftTranslateYOutput = [
    -1 * (heroWidth / 2 + SIDE_HEIGHT / 2),
    -1 * (subTitleWidth / 2),
    -1 * (SIDE_HEIGHT / 4),
    -1 * (SIDE_HEIGHT / 4),
    0,
    SIDE_HEIGHT / 4,
  ];
  const logoLeftTranslateY = useTransform(
    scrollY,
    previewScrollInput,
    logoLeftTranslateYOutput
  );

  // Animate right side of the logo
  // Step 1: from outer right to right side of subtitle
  // Step 2: from right side of subtitle to center
  // Step 3: stay at same position while outer element rotates
  // Step 4 - 6: "float" on scroll
  const logoRightTranslateYOuput = [
    heroWidth / 2 + SIDE_HEIGHT / 2,
    subTitleWidth / 2,
    SIDE_HEIGHT / 4,
    SIDE_HEIGHT / 4,
    0,
    -1 * (SIDE_HEIGHT / 4),
  ];
  const logoRightTranslateY = useTransform(
    scrollY,
    previewScrollInput,
    logoRightTranslateYOuput
  );

  // Animate preview subtitle (fade)
  // It goes from opacity 1 to opacity 0 when the
  // logo sides touch its corners
  const previewSubtitleOpacityOutput = [1, 0, 0, 0, 0, 0];
  const previewSubtitleOpacity = useTransform(
    scrollY,
    previewScrollInput,
    previewSubtitleOpacityOutput
  );

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const onResize = debounce(() => {
      const updatedHeight = hero.offsetHeight;
      const updatedTop = hero.offsetTop;
      const updatedScroll = updatedHeight - window.innerHeight;
      const updatedWidth = hero.offsetWidth;

      if (updatedTop !== heroTop) {
        setHeroTop(updatedTop);
      }

      if (updatedScroll !== heroScroll) {
        setHeroScroll(updatedScroll);
      }

      if (updatedWidth !== heroWidth) {
        setHeroWidth(updatedWidth);
      }
    }, 300);

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [heroRef, heroScroll, heroTop, heroWidth]);

  useLayoutEffect(() => {
    const onScroll = debounce(() => {
      const hasCompleted = window.scrollY >= heroWidth * 0.9; // Arbitraty number
      if (hasCompleted !== animationComplete) {
        setAnimationComplete(hasCompleted);
      }
    }, 0);

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [animationComplete, heroWidth]);

  return (
    <SandpackProvider
      customSetup={{
        files: { "/App.js": app },
        dependencies: {
          "framer-motion": "latest",
          "@stitches/react": "latest",
        },
      }}
      template="react"
    >
      <ClasserProvider
        classes={{
          "sp-layout": "custom-hero-layout",
          "sp-stack": "custom-hero-stack",
          "sp-wrapper": "custom-hero-wrapper",
        }}
      >
        <SandpackThemeProvider theme="sandpack-dark">
          <AnimateSharedLayout>
            <SectionWrapper>
              <SectionContainer
                css={{
                  margin: 0,
                  padding: 0,
                  position: "relative",
                  ".custom-hero-stack": {
                    height: "100%",
                  },
                }}
              >
                {/* Hero desktop wrapper */}
                <AnimatedBox
                  css={{
                    alignItems: "flex-start",
                    bottom: 0,
                    display: "flex",
                    height: "100vh",
                    justifyContent: "flex-end",
                    overflow: "hidden",
                    position: "fixed",
                    top: 0,
                    width: "100vw",
                    maxWidth: "2560px",

                    "> *": {
                      flexShrink: 0,
                      height: "100%",
                      width: "100%",
                    },
                  }}
                  initial={false}
                  style={{
                    scale: heroContainerScale,
                    translateY: heroSlideAway,
                  }}
                  layout
                >
                  {/* Editor */}
                  <AnimatedBox
                    css={{
                      alignItems: "center",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      pointerEvents: animationComplete ? "auto" : "none",
                      width: "50vw",
                    }}
                    initial={false}
                    style={{
                      translateX: editorTranslateX,
                    }}
                  >
                    <SandpackCodeEditor showTabs />
                  </AnimatedBox>

                  {/* Preview */}
                  <AnimatedBox
                    css={{
                      background: "$surface",
                      fontSize: "1vw" /* TODO: responsive font-sizes (?) */,
                      transformOrigin: "center right",
                      padding: "1rem 2rem",
                      width: "100vw",
                      maxWidth: "2560px",
                    }}
                    initial={false}
                    style={{ scaleX: previewContainerScaleX }}
                  >
                    {/* Preview content*/}
                    <Box
                      css={{
                        alignItems: "center",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        overflow: "hidden",
                        position: "relative",
                        width: "100%",
                      }}
                    >
                      {/* Preview header */}
                      <AnimatedBox
                        css={{
                          alignItems: "center",
                          display: "flex",
                          justifyContent: "space-between",
                          transformOrigin: "top",
                          width: "100%",
                        }}
                        initial={false}
                        style={{ scaleX: 1, scaleY: previewInnerScale }}
                      >
                        <Clipboard />
                        <Resources />
                      </AnimatedBox>

                      {/* Markup to align items to the center */}
                      <Box
                        css={{
                          alignItems: "center",
                          display: "flex",
                          justifyContent: "center",
                          position: "absolute",
                          transform: `translateY(calc(-50% - ${
                            SIDE_HEIGHT / 4
                          }px))`,
                          top: "50%",
                        }}
                      >
                        {/* Subtitle (TODO: get from website.config.js) */}
                        <AnimatedBox
                          initial={false}
                          style={{
                            opacity: previewSubtitleOpacity,
                            scaleX: 1,
                            scaleY: previewInnerScale,
                          }}
                        >
                          <Text
                            css={{
                              fontSize: "1.2rem",
                              lineHeight: 1.2,
                              letterSpacing: "-0.0125em",
                              margin: 0,
                              textAlign: "center",
                            }}
                          >
                            A component toolkit for creating your
                            <br />
                            own live running code editing experience,
                            <br /> using the power of CodeSandbox.
                          </Text>
                        </AnimatedBox>

                        {/* Logo */}
                        <AnimatedBox
                          css={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "center",
                            position: "absolute",
                            transformOrigin: "center center",
                            top: "50%",
                            zIndex: 1,
                          }}
                          initial={false}
                          style={{
                            rotate: logoRotate,
                            scaleX: 1,
                            scaleY: previewInnerScale,
                            translateY: "-50%",
                          }}
                        >
                          {/* Left side */}
                          <AnimatedBox
                            css={{ ...sharedLogoStyles }}
                            initial={false}
                            style={{
                              translateX: logoTranslateX.left,
                              translateY: logoLeftTranslateY,
                            }}
                          />

                          {/* Right side */}
                          <AnimatedBox
                            css={{ ...sharedLogoStyles }}
                            initial={false}
                            style={{
                              translateX: logoTranslateX.right,
                              translateY: logoRightTranslateY,
                            }}
                          />
                        </AnimatedBox>
                      </Box>

                      {/* Sandpack Text (SVG) */}
                      <AnimatedBox
                        css={{
                          display: "flex",
                          width: "100%",
                          transformOrigin: "center bottom",
                        }}
                        initial={false}
                        style={{ scaleX: 1, scaleY: previewInnerScale }}
                      >
                        <SandpackText width={`${heroWidth}px`} />
                      </AnimatedBox>
                    </Box>
                  </AnimatedBox>
                  <Box
                    css={{
                      position: "absolute",
                      height: "100%",
                      width: "50%",
                      bottom: 0,
                      visibility: animationComplete ? "visible" : "hidden",
                      right: 0,
                      transformOrigin: "top center",
                      zIndex: animationComplete ? 2 : -1,
                    }}
                  >
                    <SandpackPreview />
                  </Box>
                </AnimatedBox>
                {/* Sandpack Preview */}
                {/* This ghost ref sets the hero dimensions  */}
                <Box
                  ref={heroRef}
                  style={{
                    height: "150vw",
                    maxHeight: "2560px",
                    width: "100vw",
                    maxWidth: "2560px",
                  }}
                />
              </SectionContainer>
            </SectionWrapper>
          </AnimateSharedLayout>
        </SandpackThemeProvider>
      </ClasserProvider>
    </SandpackProvider>
  );
};
