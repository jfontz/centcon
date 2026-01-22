const IconWrapper = ({ src, alt, className = "w-5 h-5 min-w-5 min-h-5" }) => {
  return <img src={src} alt={alt} className={className} />;
};

export default IconWrapper;
