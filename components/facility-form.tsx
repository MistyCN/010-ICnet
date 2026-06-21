"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  validateBuilder,
  validateFacilityName,
  validateLandName,
} from "@/lib/validators";

interface FacilityFormProps {
  // 传入则为编辑模式，预填并走 PUT
  facility?: {
    id: string;
    landName: string;
    facilityName: string;
    builder: string;
  };
}

export default function FacilityForm({ facility }: FacilityFormProps) {
  const router = useRouter();
  const isEdit = Boolean(facility);

  const [landName, setLandName] = useState(facility?.landName ?? "");
  const [facilityName, setFacilityName] = useState(facility?.facilityName ?? "");
  const [builder, setBuilder] = useState(facility?.builder ?? "");

  const [landNameError, setLandNameError] = useState<string | null>(null);
  const [facilityNameError, setFacilityNameError] = useState<string | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputBase =
    "w-full text-sm px-4 py-2.5 rounded-xl border bg-card-bg text-foreground placeholder-text-light transition-all focus:outline-none focus:ring-1 focus:bg-background";
  const inputNormal = "border-border-base focus:ring-foreground focus:border-foreground";
  const inputError = "border-danger focus:ring-danger focus:border-danger";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const landNameVal = validateLandName(landName);
    const facilityNameVal = validateFacilityName(facilityName);
    const builderVal = validateBuilder(builder);

    setLandNameError(landNameVal.isValid ? null : landNameVal.error ?? null);
    setFacilityNameError(facilityNameVal.isValid ? null : facilityNameVal.error ?? null);
    setBuilderError(builderVal.isValid ? null : builderVal.error ?? null);

    if (!landNameVal.isValid || !facilityNameVal.isValid || !builderVal.isValid) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        landName: landName.trim(),
        facilityName: facilityName.trim(),
        builder: builder.trim(),
      };

      const res = isEdit
        ? await fetch(`/api/facilities/${facility!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/facilities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isEdit ? "更新失败" : "登记失败"));
        setLoading(false);
        return;
      }

      router.push("/facilities");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 text-xs bg-danger-bg border border-danger-border text-danger px-3 py-2.5 rounded-lg select-none animate-slide-down">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          领地名
        </label>
        <input
          type="text"
          value={landName}
          onChange={(e) => setLandName(e.target.value)}
          placeholder="例如：spawn-market"
          className={`${inputBase} ${landNameError ? inputError : inputNormal}`}
        />
        {landNameError && <p className="text-[10px] text-danger mt-1">{landNameError}</p>}
        <p className="text-[10px] text-text-light mt-1">
          传送指令将生成为 <span className="font-mono">/res tp &lt;领地名&gt;</span>，不能包含空格
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          设施名
        </label>
        <input
          type="text"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          placeholder="例如：主城刷铁机"
          className={`${inputBase} ${facilityNameError ? inputError : inputNormal}`}
        />
        {facilityNameError && <p className="text-[10px] text-danger mt-1">{facilityNameError}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          建造者
        </label>
        <input
          type="text"
          value={builder}
          onChange={(e) => setBuilder(e.target.value)}
          placeholder="建造者的游戏 ID"
          className={`${inputBase} ${builderError ? inputError : inputNormal}`}
        />
        {builderError && <p className="text-[10px] text-danger mt-1">{builderError}</p>}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{isEdit ? "正在更新..." : "正在登记..."}</span>
            </>
          ) : (
            <span>{isEdit ? "保存修改" : "登记设施"}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push("/facilities")}
          className="px-5 py-2.5 rounded-xl border border-border-base bg-card-bg hover:bg-card-hover text-foreground font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95"
        >
          取消
        </button>
      </div>
    </form>
  );
}
