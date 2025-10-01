import React from "react";
import DigitalCardTab from "./DigitalCardTab";

export default function DigitalCardOnly({ profile }) {
    return (
        <div className="card-only-wrapper">
            <DigitalCardTab profile={profile} />

            <style>{`
        /* 只保留卡片 */
        .card-only-wrapper .panel,
        .card-only-wrapper .h-xl,
        .card-only-wrapper .sub,
        .card-only-wrapper .p,
        .card-only-wrapper .level {
          display: none !important;
        }
        .card-only-wrapper .dc-row.two-cols {
          display: block !important; /* 不要 grid */
        }
        .card-only-wrapper .col:not(:first-child) {
          display: none !important; /* 隐藏右边说明 */
        }
      `}</style>
        </div>
    );
}