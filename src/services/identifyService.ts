import prisma from '../prisma/client.js';

interface Contact {
    id: number;
    email: string | null;
    phoneNumber: string | null;
    linkedId: number | null;
    linkPrecedence: 'primary' | 'secondary';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

interface IdentifyRequest {
    email: string | null;
    phoneNumber: string | null;
}

interface IdentifyResponse {
    contact: {
        primaryContactId: number;
        emails: string[];
        phoneNumbers: string[];
        secondaryContactIds: number[];
    };
}

export const reconcileIdentity = async (data: IdentifyRequest): Promise<IdentifyResponse> => {
    const { email, phoneNumber } = data;

    // 1. Search existing contacts
    const existingContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { email: email ?? null },
                { phoneNumber: phoneNumber ?? null },
            ],
        },
        orderBy: { createdAt: 'asc' },
    }) as Contact[];

    // 2. If no existing contact is found
    if (existingContacts.length === 0) {
        const newContact = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: 'primary',
            },
        }) as Contact;

        return {
            contact: {
                primaryContactId: newContact.id,
                emails: email ? [email] : [],
                phoneNumbers: phoneNumber ? [phoneNumber] : [],
                secondaryContactIds: [],
            },
        };
    }

    // 3. Find the oldest primary contact and collect all related contacts
    // We need to find all contacts in the same "cluster"
    const allRelatedIds = new Set<number>();
    existingContacts.forEach((c: Contact) => {
        allRelatedIds.add(c.id);
        if (c.linkedId) allRelatedIds.add(c.linkedId);
    });

    // Find all contacts that are linked to any of these
    const cluster = await prisma.contact.findMany({
        where: {
            OR: [
                { id: { in: Array.from(allRelatedIds) } },
                { linkedId: { in: Array.from(allRelatedIds) } },
                { linkedId: { in: existingContacts.filter((c: Contact) => c.linkPrecedence === 'primary').map((c: Contact) => c.id) } }
            ]
        },
        orderBy: { createdAt: 'asc' }
    }) as Contact[];

    // Refine cluster: get all primary contacts in this group
    const primaryContacts = cluster.filter((c: Contact) => c.linkPrecedence === 'primary');
    const oldestPrimary = primaryContacts[0];
    if (!oldestPrimary) {
        throw new Error('Primary contact not found');
    }

    // 4. Handle "two primary contacts connected" scenario
    if (primaryContacts.length > 1) {
        // Collect all except the oldest
        const others = primaryContacts.slice(1);
        await prisma.contact.updateMany({
            where: { id: { in: others.map((o: Contact) => o.id) } },
            data: {
                linkPrecedence: 'secondary',
                linkedId: oldestPrimary.id,
            },
        });
        // Update local cluster representation
        others.forEach((o: Contact) => {
            o.linkPrecedence = 'secondary';
            o.linkedId = oldestPrimary.id;
        });
    }

    // 5. Check if we need to create a new secondary contact
    const hasEmail = email && cluster.some((c: Contact) => c.email === email);
    const hasPhone = phoneNumber && cluster.some((c: Contact) => c.phoneNumber === phoneNumber);

    if ((email && !hasEmail) || (phoneNumber && !hasPhone)) {
        const newSecondary = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: 'secondary',
                linkedId: oldestPrimary.id,
            },
        }) as Contact;
        cluster.push(newSecondary);
    }

    // Final cluster fetch to ensure we have everything for the response
    const finalCluster = await prisma.contact.findMany({
        where: {
            OR: [
                { id: oldestPrimary.id },
                { linkedId: oldestPrimary.id }
            ]
        },
        orderBy: { createdAt: 'asc' }
    }) as Contact[];

    const emails = Array.from(new Set(finalCluster.map((c: Contact) => c.email).filter((e: string | null): e is string => !!e)));
    const phoneNumbers = Array.from(new Set(finalCluster.map((c: Contact) => c.phoneNumber).filter((p: string | null): p is string => !!p)));

    // Ensure primary contact's info is first
    if (oldestPrimary.email && emails.includes(oldestPrimary.email)) {
        emails.splice(emails.indexOf(oldestPrimary.email), 1);
        emails.unshift(oldestPrimary.email);
    }
    if (oldestPrimary.phoneNumber && phoneNumbers.includes(oldestPrimary.phoneNumber)) {
        phoneNumbers.splice(phoneNumbers.indexOf(oldestPrimary.phoneNumber), 1);
        phoneNumbers.unshift(oldestPrimary.phoneNumber);
    }

    const secondaryContactIds = finalCluster
        .filter((c: Contact) => c.linkPrecedence === 'secondary')
        .map((c: Contact) => c.id);

    return {
        contact: {
            primaryContactId: oldestPrimary.id,
            emails,
            phoneNumbers,
            secondaryContactIds,
        },
    };
};
