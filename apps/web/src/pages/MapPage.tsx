import { Link } from "react-router-dom";

import { PocketGuideMap } from "../components/PocketGuideMap";

export default function MapPage() {
  return (
    <div className="mapPageRoot">
      <Link to="/" className="mapBackBtn">
        ← Ana Sayfa
      </Link>
      <PocketGuideMap />
    </div>
  );
}

