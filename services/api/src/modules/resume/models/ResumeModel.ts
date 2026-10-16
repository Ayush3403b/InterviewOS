import { Schema, model } from "mongoose";

import { ResumeDocument, ResumeStatus } from "../types/resume.types";

const ResumeSchema = new Schema<ResumeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    rawText: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(ResumeStatus),
      default: ResumeStatus.PROCESSING,
    },

    summary: {
      type: String,
    },

    extractedSkills: {
      type: [String],
      default: [],
    },

    atsScore: {
      type: Number,
    },

    suggestions: {
      type: [String],
      default: [],
    },

    experience: {
      type: [
        {
          title: String,
          company: String,
          duration: String,
          highlights: [String],
        },
      ],
      default: [],
    },

    education: {
      type: [
        {
          degree: String,
          institution: String,
          year: String,
        },
      ],
      default: [],
    },

    projects: {
      type: [
        {
          name: String,
          description: String,
          technologies: [String],
        },
      ],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    experienceAnalysis: {
      type: {
        totalYearsExperience: Number,
        seniorityLevel: String,
        averageTenureYears: Number,
        employmentGaps: [
          {
            afterYear: Number,
            beforeYear: Number,
            gapYears: Number,
          },
        ],
        entriesWithParsedDates: Number,
      },
    },

    educationAnalysis: {
      type: {
        highestDegreeLevel: String,
        degreeCount: Number,
      },
    },

    projectAnalysis: {
      type: {
        totalProjects: Number,
        hasQuantifiedImpact: Boolean,
        distinctTechnologiesUsed: Number,
        complexityScore: Number,
      },
    },

    certificationAnalysis: {
      type: {
        totalCertifications: Number,
        recognizedCertifications: [String],
        recommendation: String,
      },
    },

    skillsGapAnalysis: {
      type: {
        inferredRoleFamily: { type: String, default: null },
        matchedSkillsForRole: [String],
        missingSkillsForRole: [String],
      },
    },

    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "resumes",
  }
);

export const ResumeModel = model<ResumeDocument>("Resume", ResumeSchema);
