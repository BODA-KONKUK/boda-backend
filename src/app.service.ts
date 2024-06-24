import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { HfInference } from '@huggingface/inference';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mimeTypes from 'mime-types';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  // @InjectRepository(Board)
  // private boardRepository: Repository<Board>;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: this.config.get<string>('ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('SECRET_ACCESS_KEY'),
      },
    });
  }

  private s3Client: S3Client;

  async visualQuestionAnswering(imageUrl, question): Promise<any> {
    const inference = new HfInference('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');
    const vqa = inference.endpoint(
      'https://pkdc7xkzxfjeygsg.us-east-1.aws.endpoints.huggingface.cloud',
    );
    const alternateModel = inference.endpoint(
      'https://pmv2sq2r47wtie5t.us-east-1.aws.endpoints.huggingface.cloud',
    );
    const timeoutDuration = 15000;

    const imageres = await fetch(imageUrl);
    const imageBlob = await imageres.blob();
    console.log(question);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          console.log('Switching to alternate model due to timeout');
          const response = await alternateModel.visualQuestionAnswering({
            inputs: {
              question: question,
              image: imageBlob,
            },
          });
          // response의 타입을 명시적으로 지정합니다.
          if (
            response &&
            typeof response === 'object' &&
            'answer' in response
          ) {
            resolve(response.answer.replace('\n', ''));
          } else {
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          console.error(
            'Error during fetching or parsing from alternate model:',
            error,
          );
          reject(error);
        }
      }, timeoutDuration);

      vqa
        .visualQuestionAnswering({
          inputs: {
            question: question,
            image: imageBlob,
          },
        })
        .then((response) => {
          clearTimeout(timeout);
          // response의 타입을 명시적으로 지정합니다.
          if (
            response &&
            typeof response === 'object' &&
            'answer' in response
          ) {
            resolve(response.answer.replace('\n', ''));
          } else {
            reject(new Error('Invalid response format'));
          }
        })
        .catch((error) => {
          console.error('Error during fetching or parsing:', error);
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  async captioning(imageUrl: string) {
    const API_TOKEN = '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';

    const imageres = await fetch(imageUrl);
    const imageBlob = await imageres.blob();

    async function query(imageBlob) {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: imageBlob,
        },
      );

      const result = await response.json();
      return result;
    }

    return query(imageBlob).then((response) => {
      const result = response[0];
      console.log('responseresult', response[0]);

      return result.generated_text;
    });
  }

  extractTranslatedText(response) {
    const startMarker = "'";
    const endMarker = "'\n";
    const startIndex = response.indexOf(startMarker) + startMarker.length;
    const endIndex = response.indexOf(endMarker, startIndex);
    return response.substring(startIndex, endIndex);
  }

  async korToEng(questionInKor: string) {
    async function query(questionInKor) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
          {
            headers: {
              Authorization: 'Bearer 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',
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(questionInKor),
          },
        );

        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${errorText}`,
          );
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error during fetching or parsing:', error);
        throw error;
      }
    }

    return await query({
      inputs: `Translate into English in a sentence: '${questionInKor}'
      `,
    })
      .then((response) => {
        console.log(response);
        // console.log(this.extractTranslatedText(response));
        return response;
      })
      .catch((error) => {
        console.error('Query failed:', error);
      });
  }

  async engToKor(questionInEng: string) {
    async function query(questionInEng) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
          {
            headers: {
              Authorization: 'Bearer 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',
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(questionInEng),
          },
        );

        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${errorText}`,
          );
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error during fetching or parsing:', error);
        throw error;
      }
    }

    return await query({
      inputs: `Translate into Korean: "${questionInEng}"`,
    })
      .then((response) => {
        // console.log(JSON.stringify(response));
        return response;
      })
      .catch((error) => {
        console.error('Query failed:', error);
      });
  }

  async vqa(imgUrl: string, question: string): Promise<string> {
    // const questionInKor = `${question}`;
    // // 한글 -> 영어
    // const engText = await this.korToEng(questionInKor);

    // const answerPrefix1 = 'The Answer is: ';
    // const generatedText1 = engText[0].generated_text;
    // const answerIndex1 =
    //   generatedText1.lastIndexOf(answerPrefix1) + answerPrefix1.length;
    // const finalAnswer1 = generatedText1.substring(answerIndex1).trim();

    // // 따옴표 사이의 텍스트를 추출하는 부분
    // const startQuoteIndex1 = finalAnswer1.indexOf('"') + 1;
    // const endQuoteIndex1 = finalAnswer1.lastIndexOf('"');
    // const engQuestion = finalAnswer1.substring(
    //   startQuoteIndex1,
    //   endQuoteIndex1,
    // );
    // console.log(engQuestion);

    const res = await this.visualQuestionAnswering(imgUrl, question);
    console.log('answer', JSON.stringify(res));

    // const answerText = res.answer;
    // const startQuoteIndex = answerText.indexOf('"') + 1;
    // const endQuoteIndex = answerText.indexOf('"', startQuoteIndex);
    // const result = answerText.substring(startQuoteIndex, endQuoteIndex);

    // console.log('result', result);

    // const korAnswer = await this.engToKor(result);
    // console.log(korAnswer);
    // const answerPrefix = 'The Answer is: ';
    // const generatedText = korAnswer[0].generated_text;
    // const answerIndex =
    //   generatedText.lastIndexOf(answerPrefix) + answerPrefix.length;
    // const finalAnswer = generatedText.substring(answerIndex).trim();

    // console.log('finalAnswer', finalAnswer);

    return res.answer.replace('\n', '');
  }

  async fileUpload(file: Express.Multer.File) {
    const contentType =
      mimeTypes.lookup(file.originalname) || 'application/octet-stream';

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: 'boda-bucket', // S3 버킷 이름
        Key: `uploads/${file.originalname}`, // 파일을 저장할 S3 내의 경로 및 파일 이름
        Body: file.buffer, // 파일 데이터
        ContentType: contentType, // ContentType 설정
      },
    });

    try {
      const result = await upload.done();
      // console.log('File uploaded:', result.Location);
      const captioningText = await this.captioning(result.Location);
      console.log(captioningText);

      return { imgUrl: result.Location, message: captioningText };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
