import type { Metadata } from "next";
import { SocialAutomationPanel } from "@/components/admin/social-automation-panel";
export const metadata:Metadata={title:"Social Media Automation | HomeScope GTA",robots:{index:false,follow:false}};
export default function SocialPage(){return <SocialAutomationPanel/>;}
