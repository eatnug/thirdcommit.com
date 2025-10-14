import type { IProjectRepository } from "@/domain/projects";
import type { Project } from "@/domain/projects";

export class InMemoryProjectRepository implements IProjectRepository {
  async getProjects(): Promise<Project[]> {
    return [
      {
        title: "What should I build next?",
        description: "Send me an idea.",
        externalLink: "mailto:jake@thirdcommit.com",
      },
      {
        title: "Melon Musk",
        description:
          "Personal todo management with time boxing. Daily sheets with priority tasks, time blocks, and brain dumps. Built with React, NestJS, and PostgreSQL.",
        externalLink: "https://melon-musk.thirdcommit.com",
      },
      {
        title: "My Feed (WIP)",
        description:
          "Fully customizable feed: add any source you follow (YouTube channels, Instagram accounts, blogs) and read everything without distractions.",
      },
      {
        title: "The Terminal X",
        description:
          "AI research agent for finance professionals. Retrieves news, analyzes market signals, and answers questions",
        externalLink: "https://theterminalx.com/",
      },
      {
        title: "DoctorNow",
        description:
          "South Korea's leading telemedicine app, enabling 24/7 remote doctor consultations and prescription services.",
        externalLink: "https://www.doctornow.co.kr/",
      },
    ];
  }
}
