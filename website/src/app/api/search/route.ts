import { searchDoc } from "@smart-doc/docs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export type SearchDocUtilParams = {
  input: string;
};
export type SearchDocUtilResult = string[];

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  const response = await searchDoc(input);
  const docFileList = response.map((doc) => doc.fileKey);

  const uniqueDocFileList = Array.from(new Set(docFileList));

  return NextResponse.json(uniqueDocFileList);
}
