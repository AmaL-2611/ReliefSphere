# SYSTEM STUDY, FEASIBILITY STUDY & QUESTIONNAIRE
**Project:** ReliefSphere — Intelligent Resource Allocation & Disaster Relief Management Platform  
**Course Code:** 20INMCA509 — Mini Project 2  

---

# SECTION 1: SYSTEM STUDY

## 1.1 Existing System Analysis
In current disaster relief management practices (such as flood or landslide relief operations), relief supply chains are managed through informal channels, phone calls, paper ledgers, or social media posts.

### Drawbacks of the Existing System:
1. **Resource Mismatch:** Donors send excess supplies of easily available items (e.g., used clothes), while essential items (e.g., infant formula, insulin, drinking water) remain severely under-supplied.
2. **Lack of Verification:** Scams and fraudulent requests occur frequently because there is no mechanism to verify recipient entities or volunteers.
3. **Logistics Bottlenecks:** No spatial proximity algorithm exists to match nearby donors with nearby camps, causing high transit delays and transport costs.
4. **Lack of Transparency:** Donors have zero visibility into whether their donated goods reached actual victims.

## 1.2 Proposed System (ReliefSphere)
**ReliefSphere** automates and optimizes the end-to-end disaster supply chain through an intelligent web platform.

### Key Advantages of Proposed System:
1. **Algorithmic Matching Engine:** Automatically calculates a match score (0-100%) based on Category, Quantity, Urgency Level, and Haversine Distance.
2. **Strict Multi-Tier Verification:** Admin verification pipeline for volunteer IDs and organization registration documents.
3. **Geo-Location Integration:** Coordinates (latitude, longitude) track precise pickup and drop locations.
4. **Proof of Delivery (PoD):** Volunteers upload geotagged images upon delivery completion.
5. **Real-time Notifications:** Automated notifications triggered at every state change (`matched`, `assigned`, `picked_up`, `delivered`).

---

# SECTION 2: FEASIBILITY STUDY

## 2.1 Technical Feasibility
* **Stack Capability:** Node.js/Express backend coupled with React frontend provides high scalability and asynchronous non-blocking performance for handling concurrent users during crisis periods.
* **Geospatial Processing:** Haversine formula provides low-cost, accurate spatial distance computation without heavy external API charges.
* **Database Performance:** MongoDB collection structure allows flexible schemas for diverse donation/requirement types (Food, Clothes, Medicine, Books, Essentials).
* **Conclusion:** **Highly Feasible.**

## 2.2 Operational Feasibility
* **User-Friendly Dashboards:** Tailored intuitive UIs for non-technical users (Donors, NGO operators, Volunteers).
* **Minimal Training Required:** Simple step-by-step forms for posting donations and requirements.
* **Mobile Responsiveness:** UIs adapt seamlessly to smartphones used by volunteers in the field.
* **Conclusion:** **Highly Feasible.**

## 2.3 Economic Feasibility
* **Open-Source Stack:** React, Express, Node.js, and MongoDB Community Edition eliminate licensing fees.
* **Cost Efficiency:** Reduces wasted relief goods and minimizes transport miles through optimal proximity matching.
* **Infrastructure Costs:** Low hosting footprint (can be deployed on free/low-cost tiers like Vercel, Render, or AWS Free Tier).
* **Conclusion:** **Highly Feasible.**

## 2.4 Schedule & Legal Feasibility
* **Development Timeline:** Structured across S9 Mini Project 2 milestones; core 60%+ functionalities implemented prior to evaluation date.
* **Data Privacy:** User password encryption (bcrypt), secure token authentication (JWT), and admin privacy controls for uploaded documents.

---

# SECTION 3: SYSTEM QUESTIONNAIRE

This questionnaire was designed and distributed to gather requirements and validate user needs for ReliefSphere.

### Part A: For Donors & Citizens
1. *How often do you contribute to disaster relief efforts?*  
   [ ] Frequently during disasters | [ ] Occasionally | [ ] Rarely | [ ] Never
2. *What is your biggest concern when donating goods?*  
   [ ] Don't know if items reached victims | [ ] Transport/Pickup hassle | [ ] Unsure what is actually needed
3. *Would an automated system that matches your items to nearest verified NGO encourage you to donate more?*  
   [ ] Yes, strongly | [ ] Neutral | [ ] No

### Part B: For Relief Organizations & NGOs
1. *How do you currently broadcast your immediate supply requirements?*  
   [ ] Social media posts | [ ] Phone calls | [ ] Direct WhatsApp groups | [ ] Paper notices
2. *How do you handle excess donations of unneeded categories?*  
   [ ] Store in warehouse | [ ] Try to re-distribute manually | [ ] Discarded/Wasted
3. *Is real-time verification of volunteers critical for your field safety?*  
   [ ] Extremely critical | [ ] Moderately important | [ ] Not important

### Part C: For Volunteers
1. *How do you discover relief delivery tasks in your local region?*  
   [ ] Word of mouth | [ ] Volunteer groups | [ ] Web platform
2. *Would uploading proof of delivery (photo + status update) improve accountability?*  
   [ ] Yes, essential | [ ] Optional | [ ] No
