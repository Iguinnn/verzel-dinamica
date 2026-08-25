import { SparklesIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type HelloWorldProps = {
  /** Story identifier this screen will implement, e.g. `ESTC-1`. */
  story: string;
  /** What the screen is expected to do once the story is picked up. */
  scope: string;
};

/**
 * Placeholder body for a scaffolded module screen.
 *
 * Each module owns its own page component, so replacing this with the real
 * implementation is a local change that cannot collide with another story.
 */
export function HelloWorld({ story, scope }: HelloWorldProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          Hello world
        </CardTitle>
        <CardDescription>{scope}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{story}</Badge>
        <span className="text-sm text-muted-foreground">
          Scaffolded screen — ready for implementation.
        </span>
      </CardContent>
    </Card>
  );
}
