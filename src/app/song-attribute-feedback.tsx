type SongAttributeFeedbackProps = {
  musicalAttributes: string[];
  personalAttributes: string[];
  musicalText: string;
  personalText: string;
  onMusicalTextChange: (value: string) => void;
  onPersonalTextChange: (value: string) => void;
};

export function SongAttributeFeedback({ musicalAttributes, personalAttributes, musicalText, personalText, onMusicalTextChange, onPersonalTextChange }: SongAttributeFeedbackProps) {
  return <>
    <div className="attribute-section"><h4>Musical attributes</h4>{musicalAttributes.length > 0 && <ul>{musicalAttributes.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>}<label className="collection-label">Add notes, one per line<textarea className="collection-textarea" value={musicalText} onChange={(event) => onMusicalTextChange(event.target.value)} placeholder={"- bright synths\n- steady rhythm"} /></label></div>
    <div className="attribute-section"><h4>Personal attributes</h4>{personalAttributes.length > 0 && <ul>{personalAttributes.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>}<label className="collection-label">Add notes, one per line<textarea className="collection-textarea" value={personalText} onChange={(event) => onPersonalTextChange(event.target.value)} placeholder={"- reminds me of summer\n- good for a walk"} /></label></div>
  </>;
}
