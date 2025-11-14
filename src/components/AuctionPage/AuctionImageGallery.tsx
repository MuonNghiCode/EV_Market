"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Car, Battery } from "lucide-react";

interface AuctionImageGalleryProps {
  images: string[] | undefined;
  title: string;
  isVehicle: boolean;
}

export default function AuctionImageGallery({
  images,
  title,
  isVehicle,
}: AuctionImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const Icon = isVehicle ? Car : Battery;

  return (
    <motion.div
      className="bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/40 shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {images && images.length > 0 ? (
          <Image
            src={images[selectedImage]}
            alt={title}
            fill
            className="object-contain p-8 drop-shadow-2xl"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-24 h-24 text-slate-300" />
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images && images.length > 1 && (
        <div className="p-4 grid grid-cols-4 gap-3 bg-gradient-to-r from-slate-50 to-blue-50">
          {images.slice(0, 4).map((img, idx) => (
            <motion.div
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                selectedImage === idx
                  ? "border-blue-400 ring-2 ring-blue-200"
                  : "border-slate-200 hover:border-blue-400"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src={img}
                alt={`View ${idx + 1}`}
                fill
                className="object-cover"
                sizes="150px"
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
