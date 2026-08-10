"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import ContentSection from "../../components/ContentSection";
import GlassyVideo from "../../components/GlassyVideo";
import Glass from "../../components/Glass";

export default function BadAppleSuzannePage() {
  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Bad Apple But It's Suzanne"
        image="/images/projects/bad_apple_suzanne.png"
        imageAlt="Bad Apple But It's Suzanne"
        description="Recreation of the Bad Apple music video with raytraced Suzanne the Blender Monkey"
      />

      <GlassyVideo
        embedLink="https://www.youtube.com/embed/2gF9ayazfIc?si=VUsPWARXY2TakBkq"
        title="Bad Apple Suzanne"
      />

      <ContentSection title="Goals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Glass className="p-4 md:p-5 h-full bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-2">
              Global Objective
            </h3>
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              For each frame, over all white pixels with monkeys and leave black
              pixels uncovered.
            </p>
          </Glass>
          <Glass className="p-4 md:p-5 h-full bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-2">Constraint</h3>
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              Keep monkeys within the camera frustum.
            </p>
          </Glass>
        </div>
        <Glass className="p-4 md:p-5 bg-white/5">
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            Save monkeys between frames to prevent strobing.
          </p>
        </Glass>
      </ContentSection>

      <ContentSection title="Algorithm">
        <p>
          I originally tried a complete ADMM with random initialization which
          was able to optimize the first frame but got stuck in a local minimum
          immediately after. Shortly after, I moved to a greedy approach that
          leverages knowledge of the entire space. The cost function contains a
          small regularizer that encourages monkeys to not cover each other.
        </p>
        <Glass className="p-4 md:p-5 bg-white/5 overflow-x-auto">
          <pre className="text-white/90 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre">
{`For each frame
    // phase 1 - greedily prune existing shapes
    For each shape from previous frame largest to smallest
        Add shape to this frame
        Reset penalty and lambda for shape
        Repeat n times
              Augmented Lagrangian ADAM step
              Armijo style line search, break if we are rejected
        Remove the shape if it increased the cost

    // phase 2 - greedily add new shapes
    Find clusters of uncovered pixels using BFS
    For each cluster centroid
        Add shape on cluster with raycast
        Repeat n times
              Augmented Lagrangian ADAM step
              Armijo style line search, break if we are rejected
        Remove the shape if it increased the cost
        Full block coordinate descent step`}
          </pre>
        </Glass>
      </ContentSection>

      <ContentSection title="Reasoning">
        <p>
          Shapes were optimized individually since the global solution did not
          care about which shapes covered what white pixels, only that they were
          covered. I found that optimizing one shape at a time instead of block
          coordinate descent worked better. From the perspective of a single
          shape, using a block coordinate descent can drastically change the cost
          function between iterations. Fixing all other shapes while we optimize
          over many iterations worked better for algorithms like L-BFGS or ADAM
          which rely on history.
        </p>
        <p>
          Sorting shapes from largest to smallest preserves larger more
          recognizable objects.
        </p>
        <p>
          I reset the penalty and lambda each frame since the cost function
          drastically changes.
        </p>
        <p>
          I was originally planning on using L-BFGS for stepping but went with
          ADAM since I was worried about the curvature history becoming stale
          with changing lagrangians. ADAM seemed like a better choice over
          Gauss-Newton or LM since the curvature was incredibly chaotic.
        </p>
        <p>
          The block coordinate step at the end allows shapes to make slight
          movements to fill in small holes left behind.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}
