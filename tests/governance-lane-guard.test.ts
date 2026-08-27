import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const guard=resolve("scripts/check-pr-governance.mjs");
const master=`# Master\n# CANONICAL FEATURE CONTRACTS — OWNER LOCKED\n## Contract\n- stable\n# END CANONICAL FEATURE CONTRACTS\n`;

function git(root:string,...args:string[]){return execFileSync("git",args,{cwd:root,encoding:"utf8"}).trim();}
function commit(root:string,message:string){git(root,"add",".");git(root,"commit","-m",message);return git(root,"rev-parse","HEAD");}
function setup(){
  const root=mkdtempSync(join(tmpdir(),"likesized-guard-"));
  mkdirSync(join(root,"docs"),{recursive:true});
  mkdirSync(join(root,"app"),{recursive:true});
  mkdirSync(join(root,"tests"),{recursive:true});
  writeFileSync(join(root,"docs/AI_MASTER_LOG.md"),master);
  writeFileSync(join(root,"app/example.ts"),"export const value=1;\n");
  writeFileSync(join(root,"tests/existing.test.ts"),"export const expected=1;\n");
  writeFileSync(join(root,"AI_REPOSITORY_RULES.md"),"rules\n");
  git(root,"init");git(root,"config","user.email","test@example.com");git(root,"config","user.name","LikeSized Test");
  const base=commit(root,"base");
  const trusted=mkdtempSync(join(tmpdir(),"likesized-trusted-"));
  mkdirSync(join(trusted,"docs"),{recursive:true});
  cpSync(join(root,"docs/AI_MASTER_LOG.md"),join(trusted,"docs/AI_MASTER_LOG.md"));
  return {root,trusted,base};
}
function run(root:string,trusted:string,base:string,head:string,body:string){
  return spawnSync(process.execPath,[guard,trusted,root],{encoding:"utf8",env:{...process.env,PR_BASE_SHA:base,PR_HEAD_SHA:head,PR_BODY:body}});
}
const repair=(stale="No")=>`Change lane: Repair\nProduct truth changed: No\nStale canon reconciliation: ${stale}\nGovernance change: No\nOwner authorization: Not applicable\n`;

test("Repair permits a normal canonical source repair",()=>{
  const {root,trusted,base}=setup();
  writeFileSync(join(root,"app/example.ts"),"export const value=2;\n");
  const head=commit(root,"repair");
  const result=run(root,trusted,base,head,repair());
  assert.equal(result.status,0,result.stderr);
});

test("Repair cannot modify protected governance",()=>{
  const {root,trusted,base}=setup();
  writeFileSync(join(root,"AI_REPOSITORY_RULES.md"),"changed rules\n");
  const head=commit(root,"governance drift");
  const result=run(root,trusted,base,head,repair());
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Repair lane may not modify protected governance/);
});

test("rewriting an existing safeguard requires explicit stale-canon reconciliation",()=>{
  const {root,trusted,base}=setup();
  writeFileSync(join(root,"tests/existing.test.ts"),"export const expected=2;\n");
  const head=commit(root,"stale assertion");
  const blocked=run(root,trusted,base,head,repair("No"));
  assert.notEqual(blocked.status,0);
  assert.match(blocked.stderr,/Stale canon reconciliation: Yes/);
  const allowed=run(root,trusted,base,head,repair("Yes"));
  assert.equal(allowed.status,0,allowed.stderr);
});

test("adding coverage to an existing safeguard does not require stale-test ceremony",()=>{
  const {root,trusted,base}=setup();
  appendFileSync(join(root,"tests/existing.test.ts"),"export const regression=true;\n");
  const head=commit(root,"add regression coverage");
  const result=run(root,trusted,base,head,repair());
  assert.equal(result.status,0,result.stderr);
});

test("a new Repair regression safeguard does not require stale-test ceremony",()=>{
  const {root,trusted,base}=setup();
  writeFileSync(join(root,"tests/new-regression.test.ts"),"export const regression=true;\n");
  const head=commit(root,"new regression safeguard");
  const result=run(root,trusted,base,head,repair());
  assert.equal(result.status,0,result.stderr);
});
