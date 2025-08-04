
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

export default function TestimonialCardSwiper({ testimonials }) {
  // Defensive: Swiper requires window (browser env). If not present, render nothing.
  if (typeof window === 'undefined') return null;
  return (
    <div className="w-full max-w-md mx-auto">
      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards, Autoplay]}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        className="mySwiper"
      >
        {testimonials.map((user, idx) => (
          <SwiperSlide key={idx}>
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 flex flex-col items-center text-center min-h-[320px] transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <img src={user.img} alt={user.name} className="w-20 h-20 rounded-full mb-4 object-cover border-4 border-indigo-100" />
              <h3 className="font-bold text-lg mb-1 text-gray-900">{user.name}</h3>
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-gray-700 mb-2 break-words whitespace-normal max-w-full">{user.text}</p>
              <span className="text-xs text-gray-500">{user.city}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
