import { Text } from "@react-email/components";
import { SingleColumn } from "responsive-react-email";

import { emailConfig } from "../config";

export const EmailSignature = () => (
  <SingleColumn pX={25}>
    <Text>
      Best regards, <br />
      <strong>Team {emailConfig.storeName}</strong>
    </Text>
  </SingleColumn>
);
