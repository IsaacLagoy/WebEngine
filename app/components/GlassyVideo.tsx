import React from "react";
import Glass from "../components/Glass";

interface GlassyVideoProps {
  embedLink: string;
  title: string;
}

const GlassyVideo: React.FC<GlassyVideoProps> = ({ embedLink, title }) => {
  return (
    <Glass className="p-4 md:p-5 mb-4 md:mb-6 break-inside-avoid hover:bg-white/15 transition-all duration-300 flex flex-col">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedLink + "&autoplay=1"}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    </Glass>
  );
};

export default GlassyVideo;