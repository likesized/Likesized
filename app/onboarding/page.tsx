export default function OnboardingPage() {
  return (
    <main className="onboardingShell">
      <section className="onboardingIntro">
        <span className="eyebrow">FIT PROFILE · 1 OF 3</span>
        <h1>Give us the measurements clothing actually cares about.</h1>
        <p>Your exact measurements can stay private. They power matching; you choose what other members see.</p>
        <div className="privacyNote"><b>Privacy default:</b> precise measurements hidden, match percentages visible.</div>
      </section>
      <form className="fitForm">
        <div className="fieldPair">
          <label>Height <div><input aria-label="Height feet" placeholder="5" /><span>ft</span><input aria-label="Height inches" placeholder="10" /><span>in</span></div></label>
          <label>Weight <div><input placeholder="194" /><span>lb</span></div></label>
        </div>
        <div className="fieldPair">
          <label>Chest / bust <div><input placeholder="43" /><span>in</span></div></label>
          <label>Waist <div><input placeholder="35" /><span>in</span></div></label>
        </div>
        <div className="fieldPair">
          <label>Hips <div><input placeholder="41" /><span>in</span></div></label>
          <label>Inseam <div><input placeholder="30" /><span>in</span></div></label>
        </div>
        <details>
          <summary>Optional measurements for even better matches</summary>
          <div className="fieldPair optionalFields">
            <label>Shoulder width <div><input placeholder="19" /><span>in</span></div></label>
            <label>Torso length <div><input placeholder="25" /><span>in</span></div></label>
          </div>
        </details>
        <button type="button" className="primaryButton fullButton">Find people LikeSized to me →</button>
      </form>
    </main>
  );
}
