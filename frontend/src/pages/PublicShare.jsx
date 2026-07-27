import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { api } from "../services/api.js";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { formatDate } from "../utils/date.js";

function profileInitials(name = "") {
  return name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "UT";
}

export function PublicShare({ shareId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.publicShare(shareId).then(setData).catch((err) => setError(err.message));
  }, [shareId]);

  if (error) {
    return <main className="loading-screen"><p className="form-error">{error}</p></main>;
  }

  if (!data) {
    return <main className="loading-screen"><Loader2 className="spin" size={28} /> Se încarcă profilul...</main>;
  }

  return (
    <main className="public-page">
      <section className="public-hero">
        <div className="brand large"><span className="brand-dot" /> UniTrack</div>
        <div className="public-avatar">
          {data.profile.avatarDataUrl ? <img src={data.profile.avatarDataUrl} alt="" /> : <span>{profileInitials(data.profile.name)}</span>}
        </div>
        <GraduationCap size={34} />
        <h1>{data.profile.name}</h1>
        <p>Medie BAC: {data.profile.bacAverage ?? "-"} · {data.profile.languageResults || "Rezultate limbă necompletate"}</p>
      </section>
      <section className="public-list">
        {data.universities.map((uni) => (
          <article className="uni-card" key={uni.id}>
            <div className="uni-avatar">{uni.name.slice(0, 2).toUpperCase()}</div>
            <div className="uni-main">
              <div className="uni-heading">
                <div>
                  <h3>{uni.name}</h3>
                  <p>{uni.program} - {uni.faculty}</p>
                </div>
                <StatusPill status={uni.status} />
              </div>
              <div className="uni-meta">
                <span>{uni.country}</span>
                <span>{formatDate(uni.deadline)}</span>
              </div>
              <ProgressBar value={uni.progress} />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
