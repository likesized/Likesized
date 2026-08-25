import test from "node:test";
import assert from "node:assert/strict";
import { newestUniqueVariationEvidence, variationEvidenceKey } from "../lib/outfit-variation-evidence.ts";

type Evidence={id:string;user:string;product:string;variation:string;created:string;size:string;color:string};
const identity=(item:Evidence)=>({userId:item.user,productId:item.product,objectiveVariantKey:item.variation,reportId:item.id,createdAt:item.created});

test("same wearer + Product + tracked variation counts once even when size/color differ",()=>{
  const rows:Evidence[]=[
    {id:"old",user:"u1",product:"p1",variation:"crew-short-uncropped",created:"2026-08-01T00:00:00Z",size:"L",color:"Brown"},
    {id:"new",user:"u1",product:"p1",variation:"crew-short-uncropped",created:"2026-08-02T00:00:00Z",size:"M",color:"Gray"},
  ];
  const unique=newestUniqueVariationEvidence(rows,identity);
  assert.equal(unique.length,1);
  assert.equal(unique[0].id,"new");
});

test("different tracked variations from the same wearer remain separate evidence",()=>{
  const rows:Evidence[]=[
    {id:"crew",user:"u1",product:"p1",variation:"crew-short-uncropped",created:"2026-08-01T00:00:00Z",size:"M",color:"Blue"},
    {id:"vneck",user:"u1",product:"p1",variation:"vneck-short-uncropped",created:"2026-08-02T00:00:00Z",size:"M",color:"Blue"},
  ];
  assert.equal(newestUniqueVariationEvidence(rows,identity).length,2);
});

test("different wearers remain independent evidence for the same tracked variation",()=>{
  const rows:Evidence[]=[
    {id:"a",user:"u1",product:"p1",variation:"crew-short-uncropped",created:"2026-08-01T00:00:00Z",size:"M",color:"Blue"},
    {id:"b",user:"u2",product:"p1",variation:"crew-short-uncropped",created:"2026-08-02T00:00:00Z",size:"M",color:"Blue"},
  ];
  assert.equal(newestUniqueVariationEvidence(rows,identity).length,2);
});

test("variation evidence key excludes size and color by construction",()=>{
  assert.equal(variationEvidenceKey("u1","p1","crew-short-uncropped","r1"),"u1:p1:crew-short-uncropped");
});
