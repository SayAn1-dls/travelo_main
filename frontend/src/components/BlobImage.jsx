import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function BlobImage({ path, alt = "", className = "" }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let obj;
    let cancelled = false;
    api.get(path, { responseType: "blob" })
      .then((r) => {
        if (cancelled) return;
        obj = URL.createObjectURL(r.data);
        setUrl(obj);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [path]);

  if (failed) return <div className={`bg-muted flex items-center justify-center text-xs text-muted-foreground ${className}`}>Image unavailable</div>;
  if (!url) return <div className={`bg-muted animate-pulse ${className}`} />;
  return <img src={url} alt={alt} className={className} />;
}
