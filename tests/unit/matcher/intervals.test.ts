import { describe, expect, it } from "vitest";
import { searchOffsets } from "@/lib/matcher/alternatives";
import { expandIntervals, isCovered, mergeIntervals, overlaps } from "@/lib/matcher/intervals";

const M = 60_000;

describe("intervals", () => {
  it("余裕時間で前後に広げる", () => {
    expect(expandIntervals([{ start: 100 * M, end: 200 * M }], 15)).toEqual([{ start: 85 * M, end: 215 * M }]);
  });

  it("重なる・接する区間を統合し、離れた区間は残す", () => {
    expect(
      mergeIntervals([
        { start: 50, end: 60 },
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 15, end: 18 },
        { start: 30, end: 40 },
      ]),
    ).toEqual([
      { start: 0, end: 20 },
      { start: 30, end: 40 },
      { start: 50, end: 60 },
    ]);
  });

  it("統合は入力を変更しない", () => {
    const input = [
      { start: 0, end: 10 },
      { start: 5, end: 20 },
    ];
    mergeIntervals(input);
    expect(input).toEqual([
      { start: 0, end: 10 },
      { start: 5, end: 20 },
    ]);
  });

  it("半開区間: 接するだけなら重ならない", () => {
    expect(overlaps({ start: 0, end: 10 }, { start: 10, end: 20 })).toBe(false);
    expect(overlaps({ start: 0, end: 11 }, { start: 10, end: 20 })).toBe(true);
  });

  it("isCovered", () => {
    expect(isCovered({ start: 5, end: 10 }, [{ start: 0, end: 10 }])).toBe(true);
    expect(isCovered({ start: 5, end: 11 }, [{ start: 0, end: 10 }])).toBe(false);
  });

  it("探索オフセットは近い順・同距離は後ろ優先", () => {
    expect(searchOffsets(45, 15)).toEqual([15, -15, 30, -30, 45, -45]);
    expect(searchOffsets(180, 15)).toHaveLength(24);
  });
});
