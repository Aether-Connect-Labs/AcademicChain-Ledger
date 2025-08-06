// packages/core/src/services/blockchain-education.service.ts
import { injectable } from 'inversify';

@injectable()
export class BlockchainEducationService {
  private readonly courses = [
    {
      id: 'blockchain-101',
      title: 'Blockchain Fundamentals',
      description: 'Learn the basics of blockchain technology',
      level: 'beginner',
      lessons: [
        {
          id: 'what-is-blockchain',
          title: 'What is Blockchain?',
          content: 'Comprehensive introduction to blockchain technology',
          duration: 15,
          media: 'ipfs://QmBlockchainIntro'
        },
        {
          id: 'decentralization',
          title: 'Decentralization Explained',
          content: 'Understanding decentralized systems',
          duration: 20,
          media: 'ipfs://QmDecentralization'
        }
      ],
      finalQuiz: {
        questions: [
          {
            question: "What's a blockchain?",
            options: ["A database", "A distributed ledger", "A cryptocurrency", "All of the above"],
            correctAnswer: 3
          },
          {
            question: "What makes blockchain secure?",
            options: ["Cryptography", "Consensus mechanisms", "Decentralization", "All of the above"],
            correctAnswer: 3
          }
        ],
        passingScore: 70
      }
    },
    {
      id: 'credentials-201',
      title: 'Digital Credentials',
      description: 'Understanding digital credentials and verifiable claims',
      level: 'intermediate',
      lessons: [
        {
          id: 'digital-credentials-intro',
          title: 'Introduction to Digital Credentials',
          content: 'Learn about digital credentials and their benefits',
          duration: 25,
          media: 'ipfs://QmDigitalCredentials'
        }
      ],
      finalQuiz: {
        questions: [
          {
            question: "What is a verifiable credential?",
            options: ["A digital certificate", "A tamper-evident credential", "A blockchain token", "A PDF document"],
            correctAnswer: 1
          }
        ],
        passingScore: 75
      }
    }
  ];

  async getRecommendedCourses(userLevel: string): Promise<any[]> {
    return this.courses.filter(course => 
      course.level === userLevel || 
      (userLevel === 'beginner' && course.level === 'intermediate')
    );
  }

  async getCourseContent(courseId: string): Promise<any> {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async validateQuizAnswers(
    courseId: string,
    answers: { [questionIndex: number]: number }
  ): Promise<any> {
    const course = await this.getCourseContent(courseId);
    const quiz = course.finalQuiz;
    
    const score = quiz.questions.reduce((total: number, question: any, index: number) => {
      return total + (answers[index] === question.correctAnswer ? 1 : 0);
    }, 0) * 100 / quiz.questions.length;
    
    const passed = score >= quiz.passingScore;
    
    if (passed) {
      await this.issueCourseCompletionCredential(courseId, score);
    }
    
    return {
      score,
      passed,
      correctAnswers: quiz.questions.map((q: any, i: number) => ({
        questionId: i,
        correct: answers[i] === q.correctAnswer
      }))
    };
  }

  private async issueCourseCompletionCredential(
    courseId: string,
    score: number
  ): Promise<string> {
    // Implementar emisión de credencial NFT por completar curso
    return `credential-${courseId}-${Date.now()}`;
  }
}
