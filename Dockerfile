FROM node:lts-alpine AS buildernodejscache
ADD ui/package.json /app/package.json
WORKDIR /app
RUN npm i

FROM node:lts-alpine AS buildernodejs
ADD ui /app
WORKDIR /app
COPY --from=buildernodejscache /app/node_modules /app/node_modules
RUN npm run build \
    && chmod -R 650 /app/dist


FROM alpine:3 AS buildergolang
ADD backend /app
WORKDIR /app
COPY --from=buildernodejs /app/dist /app/embed/ui
RUN apk add --no-cache go

RUN go build -o als && \
    chmod +x als

FROM alpine:3 AS builderenv
WORKDIR /app
ADD scripts /app
RUN sh /app/install-software.sh
RUN apk add --no-cache \
    iperf iperf3 \
    mtr \
    traceroute \
    iputils
RUN rm -rf /app

FROM alpine:3
LABEL maintainer="samlm0 <update@ifdream.net>"
COPY --from=builderenv / /
COPY --from=buildergolang --chmod=777 /app/als/als /bin/als

CMD /bin/als
