import { Button } from "@react-email/components";

type Props = { link: string; label: string; style?: React.CSSProperties };

export const EmailCallToActionButton = (props: Props) => (
  <Button
    href={props.link}
    style={{
      background: "teal",
      color: "white",
      borderRadius: 4.5,

      margin: "36px 0 8px",
      padding: "13.5px 0",
      width: "100%",
      textAlign: "center",
      ...props.style,
    }}
  >
    {props.label} &nbsp; &rarr;
  </Button>
);
